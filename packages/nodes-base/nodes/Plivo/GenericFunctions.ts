import {
	IExecuteFunctions,
	IHookFunctions,
} from 'n8n-core';

import {
	IDataObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Make an API request to Plivo.
 *
 * @param {IHookFunctions} this
 * @param {string} method
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
export async function plivoApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {

	const credentials = await this.getCredentials('plivoApi') as { authId: string, authToken: string };

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials returned!');
	}

	const options = {
		method,
		form: body,
		qs,
		uri: `https://api.plivo.com/v1/Account/${credentials.authId}${endpoint}/`,
		auth: {
			user: credentials.authId,
			pass: credentials.authToken,
		},
		json: true,
	};

	try {
		return await this.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}
