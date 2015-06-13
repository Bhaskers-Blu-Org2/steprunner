/// <reference path="./definitions/Q.d.ts" />
/// <reference path="./definitions/node.d.ts"/>

import events = require('events');
var cm = require('./common');
var Q = require('q');
import ifm = require('./interfaces');

export interface IJobStep {
	id: string;
	displayName: string;
	continueOnError: boolean;
	alwaysRun: boolean;
	result: ifm.TaskResult;
	run(): Q.Promise<ifm.TaskResult>;
}

class JobStep implements IJobStep {
	public id: string;
	public displayName: string;
	public continueOnError: boolean;
	public alwaysRun: boolean;
	// engine sets
	public result: ifm.TaskResult;

	constructor(id: string, displayName: string, continueOnError: boolean, alwaysRun: boolean) {
		this.id = id;
		this.displayName = displayName;
		this.continueOnError = continueOnError;
		this.alwaysRun = alwaysRun;
	}

	public run(): Q.Promise<ifm.TaskResult> {
		var defer = Q.defer();
		defer.resolve(this.result);

		return <Q.Promise<ifm.TaskResult>>defer.promise;		
	}
}

/*
export enum TaskResult {
    Succeeded = 0,
    SucceededWithIssues = 1,
    Failed = 2,
    Cancelled = 3,
    Skipped = 4,
    Abandoned = 5,
}
*/

export class StepRunner extends events.EventEmitter {
	constructor() {
		this.steps = [];
		this.succeededCount = 0;
		this.withIssuesCount = 0;
		this.failedCount = 0;
		this.skippedCount = 0;
		this._hasFailed = false;
		this._result = ifm.TaskResult.Succeeded;
		super();
	}

	public steps: IJobStep[];
	public succeededCount: number;
	public failedCount: number;
	public skippedCount: number;
	public withIssuesCount: number;

	private _result: ifm.TaskResult;
	private _hasFailed: boolean;

	public addStep(step: IJobStep) {
		step.result = ifm.TaskResult.Skipped;
		this.steps.push(step);
	}

	public run(): Q.Promise<ifm.TaskResult> {
		return cm.execAll(this.runStep, this.steps, this)
		.then(() => {
			return this._result;
		})
		.fail((err) => {
			// TODO: unhandled
			console.error('Error Occurred:' + err.message);
		})
	}

	public runStep(step: IJobStep, state: any) {

		if (state._hasFailed && !step.alwaysRun) {
			//skip
			++state.skippedCount;
			return Q(null);
		}

		state.emit('stepStart', step);
		return step.run()
		.then((result: ifm.TaskResult) => {
			
			if (result == ifm.TaskResult.Failed && !step.continueOnError) {
				// update cumulative result
				state._result = ifm.TaskResult.Failed;

				state._hasFailed = true;
			}

			if (result == ifm.TaskResult.Failed && step.continueOnError) {
				// update cumulative result
				if (state._result == ifm.TaskResult.Succeeded) {
					state._result = ifm.TaskResult.SucceededWithIssues;	
				}
				
				result = ifm.TaskResult.SucceededWithIssues;
			}

			step.result = result;

			switch (step.result) {
				case ifm.TaskResult.Succeeded:
					++state.succeededCount;
					break;
				case ifm.TaskResult.SucceededWithIssues:
					++state.withIssuesCount;
					break;					
				case ifm.TaskResult.Failed:
					++state.failedCount;
					break;
				case ifm.TaskResult.Skipped:
					++state.skippedCount;
					break;
				default:
					console.error('Unexpected TaskResult: ' + step.result);
			}

			state.emit('stepDone', step);			
		});
	}	
}