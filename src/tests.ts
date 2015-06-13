/// <reference path="./definitions/mocha.d.ts"/>

import srm = require('./steprunner');
import ifm = require('./interfaces');
import Q = require('q');
import assert = require('assert');

class testStep implements srm.IJobStep {
	private _result: ifm.TaskResult;
	public id: string;
	public displayName: string;
	public continueOnError: boolean;
	public alwaysRun: boolean;
	// engine sets
	public result: ifm.TaskResult;

	constructor(id: string, displayName: string, continueOnError: boolean, alwaysRun: boolean, desiredResult: ifm.TaskResult) {
		this.id = id;
		this.displayName = displayName;
		this.continueOnError = continueOnError;
		this.alwaysRun = alwaysRun;
		this._result = desiredResult;
	}

	public run(): Q.Promise<ifm.TaskResult> {
		var defer = Q.defer();
		defer.resolve(this._result);

		return <Q.Promise<ifm.TaskResult>>defer.promise;		
	}
}

describe('Engine Suite', function() {

	before((done) => {
		// init here
		done();
	});

	after(function() {

	});

	describe('StepRunner', function() {
		it('Reports all succeeded', (done) => {
			this.timeout(500);

			var started = 0;
			var completed = 0;
			var stepRunner = new srm.StepRunner();
			stepRunner.on('stepStart', (step) => {
				++started;
			});
			stepRunner.on('stepDone', (step) => {
				++completed;
			});

			stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.addStep(new testStep('id2', 'Test Step 2: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.run()
			.then((result) => {
				assert(result == ifm.TaskResult.Succeeded, 'result should be succeeded');
				assert(stepRunner.succeededCount == 2, 'succeeded count should be 2');
				assert(stepRunner.failedCount == 0, 'failed count should be 0');
				assert(stepRunner.skippedCount == 0, 'skipped count should be 0');
				assert(started == 2, '2 steps should have started');
				assert(completed == 2, '2 steps should have completed');
				done();
			})
			.fail((err) => {
				done(err);
			});
		})		
		it('Does not run tasks after a failed task', (done) => {
			this.timeout(500);

			var started = 0;
			var completed = 0;
			var stepRunner = new srm.StepRunner();
			stepRunner.on('stepStart', (step) => {
				++started;
			});
			stepRunner.on('stepDone', (step) => {
				++completed;
			});
			stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.addStep(new testStep('id2', 'Test Step 2: Failed', false, false, ifm.TaskResult.Failed));
			// should never run
			stepRunner.addStep(new testStep('id3', 'Test Step 3: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.run()
			.then((result) => {
				assert(result == ifm.TaskResult.Failed, 'result should be failed');
				assert(stepRunner.succeededCount == 1, 'succeeded count should be 1');
				assert(stepRunner.failedCount == 1, 'failed count should be 1');
				assert(stepRunner.skippedCount == 1, 'skipped count should be 1');
				assert(started == 2, '2 steps should have started');
				assert(completed == 2, '2 steps should have completed');
				done();
			})
			.fail((err) => {
				done(err);
			});
		})
		it('AlwaysRuns runs after a failed task', (done) => {
			this.timeout(500);

			var started = 0;
			var completed = 0;
			var stepRunner = new srm.StepRunner();
			stepRunner.on('stepStart', (step) => {
				++started;
			});
			stepRunner.on('stepDone', (step) => {
				++completed;
			});
			stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.addStep(new testStep('id2', 'Test Step 2: Failed', false, false, ifm.TaskResult.Failed));
			// should never run
			stepRunner.addStep(new testStep('id3', 'Test Always Run: Success', false, true, ifm.TaskResult.Succeeded));
			stepRunner.run()
			.then((result) => {
				assert(result == ifm.TaskResult.Failed, 'result should be failed');
				assert(stepRunner.succeededCount == 2, 'succeeded count should be 2');
				assert(stepRunner.failedCount == 1, 'failed count should be 1');
				assert(stepRunner.skippedCount == 0, 'skipped count should be 0');
				assert(started == 3, '3 steps should have started');
				assert(completed == 3, '3 steps should have completed');
				done();
			})
			.fail((err) => {
				done(err);
			});
		})
		it('AlwaysRuns after failed task can contribute to failed count', (done) => {
			this.timeout(500);

			var started = 0;
			var completed = 0;
			var stepRunner = new srm.StepRunner();
			stepRunner.on('stepStart', (step) => {
				++started;
			});
			stepRunner.on('stepDone', (step) => {
				++completed;
			});
			stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.addStep(new testStep('id2', 'Test Step 2: Failed', false, false, ifm.TaskResult.Failed));
			// should never run
			stepRunner.addStep(new testStep('id3', 'Test AlwaysRun: Failed', false, true, ifm.TaskResult.Failed));
			stepRunner.run()
			.then((result) => {
				assert(result == ifm.TaskResult.Failed, 'result should be failed');
				assert(stepRunner.succeededCount == 1, 'succeeded count should be 1');
				assert(stepRunner.failedCount == 2, 'failed count should be 2');
				assert(stepRunner.skippedCount == 0, 'skipped count should be o');
				assert(started == 3, '2 steps should have started');
				assert(completed == 3, '2 steps should have completed');
				done();
			})
			.fail((err) => {
				done(err);
			});
		})
		it('Leads to SucceededWithIssues if ContinueOnError', (done) => {
			this.timeout(500);

			var started = 0;
			var completed = 0;
			var stepRunner = new srm.StepRunner();
			stepRunner.on('stepStart', (step) => {
				++started;
			});
			stepRunner.on('stepDone', (step) => {
				++completed;
			});
			stepRunner.addStep(new testStep('id1', 'Test Step 1: ContinueOnError', true, false, ifm.TaskResult.Failed));
			stepRunner.addStep(new testStep('id2', 'Test Step 2: Success', false, false, ifm.TaskResult.Succeeded));
			stepRunner.run()
			.then((result) => {
				assert(result == ifm.TaskResult.SucceededWithIssues, 'result should be succeeded with issues');
				assert(stepRunner.succeededCount == 1, 'succeeded count should be 1');
				assert(stepRunner.withIssuesCount == 1, 'succeeded with issues count should be 1');
				assert(started == 2, '2 steps should have started');
				assert(completed == 2, '2 steps should have completed');
				done();
			})
			.fail((err) => {
				done(err);
			});
		})						
	});
});