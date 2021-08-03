import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	OptionsWithUri,
} from 'request';
import { LoaderGetResponse } from './types';

export async function monicaCrmApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = this.getCredentials('monicaCrmApi') as { apiToken: string };

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	const options: OptionsWithUri = {
		headers: {
			Authorization: `Bearer ${credentials.apiToken}`,
		},
		method,
		body,
		qs,
		uri: `https://app.monicahq.com/api${endpoint}`,
		json: true,
	};

	if (!Object.keys(body).length) {
		delete options.body;
	}

	if (!Object.keys(qs).length) {
		delete options.qs;
	}

	try {
		console.log(options);
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function monicaCrmApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	{ forLoader }: { forLoader: boolean } = { forLoader: false },
) {
	const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;
	const limit = this.getNodeParameter('limit', 0, 0) as number;

	let totalItems = 0;

	let responseData;
	const returnData: IDataObject[] = [];

	do {
		responseData = await monicaCrmApiRequest.call(this, method, endpoint, body, qs);
		returnData.push(...responseData.data);

		if (!forLoader && !returnAll && returnData.length > limit) {
			return returnData.slice(0, limit);
		}

		totalItems = responseData.meta.total;
	} while (totalItems > returnData.length);

	return returnData;
}

/**
 * Get day, month, and year from the n8n UI datepicker.
 */
export const getDateParts = (date: string) =>
	date.split('T')[0].split('-').map(Number).reverse();

export const toOptions = (response: LoaderGetResponse) =>
	response.data.map(({ id, name }) => ({ value: id, name }));
