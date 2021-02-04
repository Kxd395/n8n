// @ts-ignore
import * as Bull from 'bull';
import * as config from '../config';
import { IBullJobData } from './Interfaces';

export class Queue {
	private jobQueue: Bull.Queue;
	
	constructor() {
		const prefix = config.get('queue.bull.prefix') as string;
		const redisOptions = config.get('queue.bull.redis') as object;
		// @ts-ignore
		this.jobQueue = new Bull('jobs', { prefix, redis: redisOptions, enableReadyCheck: false });
	}
	
	async add(jobData: IBullJobData, jobOptions: object): Promise<Bull.Job> {
		return await this.jobQueue.add(jobData,jobOptions);
	}
	
	async getJob(jobId: Bull.JobId): Promise<Bull.Job | null> {
		return await this.jobQueue.getJob(jobId);
	}
	
	async getJobs(jobTypes: Bull.JobStatus[]): Promise<Bull.Job[]> {
		return await this.jobQueue.getJobs(jobTypes);
	}
	
	getBullObjectInstance(): Bull.Queue {
		return this.jobQueue;
	}
}

let activeQueueInstance: Queue | undefined;

export function getInstance(): Queue {
	if (activeQueueInstance === undefined) {
		activeQueueInstance = new Queue();
	}
	
	return activeQueueInstance;
}
