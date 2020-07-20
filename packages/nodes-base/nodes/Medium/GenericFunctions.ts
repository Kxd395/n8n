import {
	OptionsWithUri,
} from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	IDataObject,
} from 'n8n-workflow';

export async function mediumApiRequest(this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions, method: string, endpoint: string, body: any = {}, query: IDataObject = {}, uri?: string): Promise<any> { // tslint:disable-line:no-any

	let authenticationMethod = this.getNodeParameter('authentication', 0);

	const options: OptionsWithUri = {
		method,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Accept-Charset': 'utf-8',
		},
		qs: query,
		uri: uri || `https://api.medium.com/v1${endpoint}`,
		body,
		json: true,
	};

	try {
		if (authenticationMethod === 'accessToken') {
			const credentials = this.getCredentials('mediumApi');

			if (credentials === undefined) {
				throw new Error('No credentials got returned!');
			}

			options.headers!['Authorization'] = `Bearer ${credentials.accessToken}`;

			return await this.helpers.request!(options);
		} else {
			return await this.helpers.requestOAuth2!.call(this, 'mediumOAuth2Api', options);
		}
	} catch (error) {
		if (error.statusCode === 401) {
			throw new Error('The Medium credentials are not valid!');
		}

		if (error.response && error.response.body && error.response.body.errors) {
			// Try to return the error prettier
			// const errorMessage = error.response.body.errors.map((e: IDataObject) => e.description);

			// throw new Error(`Medium Error response [${errorMessage}]`);
		}

		// If that data does not exist for some reason return the actual error
		throw error;
	}
}

