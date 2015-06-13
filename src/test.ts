
import srm = require('./steprunner');
import ifm = require('./interfaces');
var Q = require('q');

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

		console.log('Running ' + this.displayName + ': ' + this.id);
		setTimeout(() => {
			console.log('Result: ' + ifm.TaskResult[this._result]);
			defer.resolve(this._result);
		}, 1000);

		return defer.promise;		
	}
}

function assertCounts(steps:srm.IJobStep[], success: number, failed: number, skipped: number) {
	var sCount: number = 0;
	var fCount: number = 0;
	var skCount: number = 0;

	steps.forEach((step: srm.IJobStep) => {
		switch (step.result) {
			case ifm.TaskResult.Succeeded:
				++sCount;
				break;
			case ifm.TaskResult.Failed:
				++ fCount;
				break;
			case ifm.TaskResult.Skipped:
				++ skCount;
				break;
			default:
				console.error('Unexpected TaskResult: ' + step.result);
		}
	});

	var failure = false;
	if (sCount !== success) {
		console.error('Expected success: ' + success + ' instead ' + sCount);
		failure = true;
	}

	if (fCount !== failed) {
		console.error('Expected failed: ' + failed + ' instead ' + fCount);
		failure = true;
	}

	if (skCount !== skipped) {
		console.error('Expected skipped: ' + skipped + ' instead ' + skCount);
		failure = true;
	}

	if (!failure) {
		console.log('Success');
	}
}

console.log('---------------------------------');
console.log('Testing: Two success');
console.log('---------------------------------');
var stepRunner = new srm.StepRunner();
stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
stepRunner.addStep(new testStep('id2', 'Test Step 2: Failed', false, false, ifm.TaskResult.Failed));
stepRunner.run()
.then(() => {
	//                             s  f  sk
	assertCounts(stepRunner.steps, 1, 1, 0);
	console.log('done');
});

console.log('---------------------------------');
console.log('Testing: One success, one failure');
console.log('---------------------------------');
var stepRunner = new srm.StepRunner();
stepRunner.addStep(new testStep('id1', 'Test Step 1: Success', false, false, ifm.TaskResult.Succeeded));
stepRunner.addStep(new testStep('id2', 'Test Step 2: Failed', false, false, ifm.TaskResult.Failed));
stepRunner.run()
.then(() => {
	//                             s  f  sk
	assertCounts(stepRunner.steps, 1, 1, 0);
	console.log('done');
});