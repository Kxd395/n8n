import { OptionsWithUri } from 'request';

import { simpleParser } from 'mailparser';

import { IExecuteFunctions, IExecuteSingleFunctions, ILoadOptionsFunctions } from 'n8n-core';

import {
	IBinaryKeyData,
	ICredentialDataDecryptedObject,
	IDataObject,
	INodeExecutionData,
	IPollFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import moment from 'moment-timezone';

import jwt from 'jsonwebtoken';

import { DateTime } from 'luxon';

import { isEmpty } from 'lodash';

export interface IEmail {
	from?: string;
	to?: string;
	cc?: string;
	bcc?: string;
	inReplyTo?: string;
	reference?: string;
	subject: string;
	body: string;
	htmlBody?: string;
	attachments?: IDataObject[];
}

export interface IAttachments {
	type: string;
	name: string;
	content: string;
}

const mailComposer = require('nodemailer/lib/mail-composer');

export async function googleApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
) {
	let options: OptionsWithUri = {
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: uri || `https://www.googleapis.com${endpoint}`,
		qsStringifyOptions: {
			arrayFormat: 'repeat',
		},
		json: true,
	};

	options = Object.assign({}, options, option);

	try {
		if (Object.keys(body).length === 0) {
			delete options.body;
		}

		let credentialType = 'gmailOAuth2';
		const authentication = this.getNodeParameter('authentication', 0) as string;

		if (authentication === 'serviceAccount') {
			const credentials = await this.getCredentials('googleApi');
			credentialType = 'googleApi';

			const { access_token } = await getAccessToken.call(this, credentials);

			(options.headers as IDataObject)['Authorization'] = `Bearer ${access_token}`;
		}

		const response = await this.helpers.requestWithAuthentication.call(
			this,
			credentialType,
			options,
		);
		return response;
	} catch (error) {
		if (error.code === 'ERR_OSSL_PEM_NO_START_LINE') {
			error.statusCode = '401';
		}

		if (error.httpCode === '404') {
			let resource = this.getNodeParameter('resource', 0) as string;
			if (resource === 'label') {
				resource = 'label ID';
			}
			const options = {
				message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`,
				description: '',
			};
			throw new NodeApiError(this.getNode(), error, options);
		}

		if (error.httpCode === '409') {
			const resource = this.getNodeParameter('resource', 0) as string;
			if (resource === 'label') {
				const options = {
					message: `Label name exists already`,
					description: '',
				};
				throw new NodeApiError(this.getNode(), error, options);
			}
		}

		if (error.code === 'EAUTH') {
			const options = {
				message: error?.body?.error_description || 'Authorization error',
				description: (error as Error).message,
			};
			throw new NodeApiError(this.getNode(), error, options);
		}

		throw new NodeApiError(this.getNode(), error, {
			message: error.message,
			description: error.description,
		});
	}
}

export async function parseRawEmail(
	this: IExecuteFunctions | IPollFunctions,
	// tslint:disable-next-line:no-any
	messageData: any,
	dataPropertyNameDownload: string,
): Promise<INodeExecutionData> {
	const messageEncoded = Buffer.from(messageData.raw, 'base64').toString('utf8');
	let responseData = await simpleParser(messageEncoded);

	const headers: IDataObject = {};
	// @ts-ignore
	for (const header of responseData.headerLines) {
		headers[header.key] = header.line;
	}

	// @ts-ignore
	responseData.headers = headers;
	// @ts-ignore
	responseData.headerLines = undefined;

	const binaryData: IBinaryKeyData = {};
	if (responseData.attachments) {
		const downloadAttachments = this.getNodeParameter('downloadAttachments', 0, false) as boolean;
		if (downloadAttachments) {
			for (let i = 0; i < responseData.attachments.length; i++) {
				const attachment = responseData.attachments[i];
				binaryData[`${dataPropertyNameDownload}${i}`] = await this.helpers.prepareBinaryData(
					attachment.content,
					attachment.filename,
					attachment.contentType,
				);
			}
		}
		// @ts-ignore
		responseData.attachments = undefined;
	}

	const mailBaseData: IDataObject = {};

	const resolvedModeAddProperties = ['id', 'threadId', 'labelIds', 'sizeEstimate'];

	for (const key of resolvedModeAddProperties) {
		// @ts-ignore
		mailBaseData[key] = messageData[key];
	}

	responseData = Object.assign(mailBaseData, responseData);

	return {
		json: responseData as unknown as IDataObject,
		binary: Object.keys(binaryData).length ? binaryData : undefined,
	} as INodeExecutionData;
}

//------------------------------------------------------------------------------------------------------------------------------------------
// This function converts an email object into a MIME encoded email and then converts that string into base64 encoding
// for more info on MIME, https://docs.microsoft.com/en-us/previous-versions/office/developer/exchange-server-2010/aa494197(v%3Dexchg.140)
//------------------------------------------------------------------------------------------------------------------------------------------

export async function encodeEmail(email: IEmail) {
	// https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields
	let mailBody: Buffer;

	const mailOptions = {
		from: email.from,
		to: email.to,
		cc: email.cc,
		bcc: email.bcc,
		inReplyTo: email.inReplyTo,
		references: email.reference,
		subject: email.subject,
		text: email.body,
		keepBcc: true,
	} as IDataObject;

	if (email.htmlBody) {
		mailOptions.html = email.htmlBody;
	}

	if (
		email.attachments !== undefined &&
		Array.isArray(email.attachments) &&
		email.attachments.length > 0
	) {
		const attachments = email.attachments.map((attachment) => ({
			filename: attachment.name,
			content: attachment.content,
			contentType: attachment.type,
			encoding: 'base64',
		}));

		mailOptions.attachments = attachments;
	}

	const mail = new mailComposer(mailOptions).compile();

	// by default the bcc headers are deleted when the mail is built.
	// So add keepBcc flag to averride such behaviour. Only works when
	// the flag is set after the compilation.
	//https://nodemailer.com/extras/mailcomposer/#bcc
	mail.keepBcc = true;

	mailBody = await mail.build();

	return mailBody.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function googleApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
	propertyName: string,
	method: string,
	endpoint: string,
	// tslint:disable-next-line:no-any
	body: any = {},
	query: IDataObject = {},
	// tslint:disable-next-line:no-any
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;
	query.maxResults = 100;

	do {
		responseData = await googleApiRequest.call(this, method, endpoint, body, query);
		query.pageToken = responseData['nextPageToken'];
		returnData.push.apply(returnData, responseData[propertyName]);
	} while (responseData['nextPageToken'] !== undefined && responseData['nextPageToken'] !== '');

	return returnData;
}

export function extractEmail(s: string) {
	if (s.includes('<')) {
		const data = s.split('<')[1];
		return data.substring(0, data.length - 1);
	}
	return s;
}

function getAccessToken(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	credentials: ICredentialDataDecryptedObject,
): Promise<IDataObject> {
	//https://developers.google.com/identity/protocols/oauth2/service-account#httprest

	const scopes = [
		'https://www.googleapis.com/auth/gmail.labels',
		'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
		'https://www.googleapis.com/auth/gmail.addons.current.message.action',
		'https://mail.google.com/',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/gmail.compose',
	];

	const now = moment().unix();

	credentials.email = (credentials.email as string).trim();
	const privateKey = (credentials.privateKey as string).replace(/\\n/g, '\n').trim();

	const signature = jwt.sign(
		{
			iss: credentials.email as string,
			sub: credentials.delegatedEmail || (credentials.email as string),
			scope: scopes.join(' '),
			aud: `https://oauth2.googleapis.com/token`,
			iat: now,
			exp: now + 3600,
		},
		privateKey,
		{
			algorithm: 'RS256',
			header: {
				kid: privateKey,
				typ: 'JWT',
				alg: 'RS256',
			},
		},
	);

	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		method: 'POST',
		form: {
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: signature,
		},
		uri: 'https://oauth2.googleapis.com/token',
		json: true,
	};

	//@ts-ignore
	return this.helpers.request(options);
}

export function prepareQuery(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions,
	fields: IDataObject,
) {
	const qs: IDataObject = { ...fields };
	if (qs.labelIds) {
		if (qs.labelIds === '') {
			delete qs.labelIds;
		} else {
			qs.labelIds = qs.labelIds as string[];
		}
	}

	if (qs.sender) {
		if (qs.q) {
			qs.q += ` from:${qs.sender}`;
		} else {
			qs.q = `from:${qs.sender}`;
		}
		delete qs.sender;
	}

	if (qs.readStatus && qs.readStatus !== 'both') {
		if (qs.q) {
			qs.q += ` is:${qs.readStatus}`;
		} else {
			qs.q = `is:${qs.readStatus}`;
		}
		delete qs.readStatus;
	}

	if (qs.receivedAfter) {
		let timestamp = DateTime.fromISO(qs.receivedAfter as string).toSeconds();
		const timestampLengthInMilliseconds1990 = 12;

		if (!timestamp && (qs.receivedAfter as string).length < timestampLengthInMilliseconds1990) {
			timestamp = parseInt(qs.receivedAfter as string, 10);
		}

		if (!timestamp) {
			timestamp = Math.floor(
				DateTime.fromMillis(parseInt(qs.receivedAfter as string, 10)).toSeconds(),
			);
		}

		if (!timestamp) {
			const description = `'${qs.receivedAfter}' isn't a valid date and time. If you're using an expression, be sure to set an ISO date string or a timestamp.`;
			throw new NodeOperationError(this.getNode(), `Invalid date/time in 'Received After' field`, {
				description,
			});
		}

		if (qs.q) {
			qs.q += ` after:${timestamp}`;
		} else {
			qs.q = `after:${timestamp}`;
		}
		delete qs.receivedAfter;
	}

	if (qs.receivedBefore) {
		let timestamp = DateTime.fromISO(qs.receivedBefore as string).toSeconds();
		const timestampLengthInMilliseconds1990 = 12;

		if (!timestamp && (qs.receivedBefore as string).length < timestampLengthInMilliseconds1990) {
			timestamp = parseInt(qs.receivedBefore as string, 10);
		}

		if (!timestamp) {
			timestamp = Math.floor(
				DateTime.fromMillis(parseInt(qs.receivedBefore as string, 10)).toSeconds(),
			);
		}

		if (!timestamp) {
			const description = `'${qs.receivedBefore}' isn't a valid date and time. If you're using an expression, be sure to set an ISO date string or a timestamp.`;
			throw new NodeOperationError(this.getNode(), `Invalid date/time in 'Received Before' field`, {
				description,
			});
		}

		if (qs.q) {
			qs.q += ` before:${timestamp}`;
		} else {
			qs.q = `before:${timestamp}`;
		}
		delete qs.receivedBefore;
	}

	return qs;
}

export function prepareEmailsInput(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	input: string,
	fieldName: string,
	itemIndex: number,
) {
	let emails = '';

	input.split(',').forEach((entry) => {
		const email = entry.trim();

		if (email.indexOf('@') === -1) {
			const description = `The email address '${email}' in the '${fieldName}' field isn't valid`;
			throw new NodeOperationError(this.getNode(), `Invalid email address`, {
				description,
				itemIndex,
			});
		}
		if (email.includes('<') && email.includes('>')) {
			emails += `${email},`;
		} else {
			emails += `<${email}>, `;
		}
	});

	return emails;
}

export function prepareEmailBody(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	itemIndex: number,
) {
	const emailType = this.getNodeParameter('emailType', itemIndex) as string;

	let body = '';
	let htmlBody = '';

	if (emailType === 'html') {
		htmlBody = (this.getNodeParameter('message', itemIndex, '') as string).trim();
	} else {
		body = (this.getNodeParameter('message', itemIndex, '') as string).trim();
	}

	return { body, htmlBody };
}

export async function prepareEmailAttachments(
	this: IExecuteFunctions,
	options: IDataObject,
	items: INodeExecutionData[],
	itemIndex: number,
) {
	const attachmentsList: IDataObject[] = [];
	const attachments = (options as IDataObject).attachmentsBinary as IDataObject[];

	if (attachments && !isEmpty(attachments) && items[itemIndex].binary) {
		for (const { property } of attachments) {
			for (const name of (property as string).split(',')) {
				if (items[itemIndex].binary![name] === undefined) {
					const description = `This node has no input field called '${name}' `;
					throw new NodeOperationError(this.getNode(), `Attachment not found`, {
						description,
						itemIndex,
					});
				}

				const binaryData = items[itemIndex].binary![name];
				const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, name);

				if (!Buffer.isBuffer(binaryDataBuffer)) {
					const description = `The input field '${name}' doesn't contain an attachment. Please make sure you specify a field containing binary data`;
					throw new NodeOperationError(this.getNode(), `Attachment not found`, {
						description,
						itemIndex,
					});
				}

				attachmentsList.push({
					name: binaryData.fileName || 'unknown',
					content: binaryDataBuffer,
					type: binaryData.mimeType,
				});
			}
		}
	}
	return attachmentsList;
}

export function unescapeSnippets(items: IDataObject[]) {
	const result = items.map((item) => {
		const snippet = (item.json as IDataObject).snippet as string;
		if (snippet) {
			(item.json as IDataObject).snippet = snippet.replace(
				/&amp;|&lt;|&gt;|&#39;|&quot;/g,
				(match) => {
					switch (match) {
						case '&amp;':
							return '&';
						case '&lt;':
							return '<';
						case '&gt;':
							return '>';
						case '&#39;':
							return "'";
						case '&quot;':
							return '"';
						default:
							return match;
					}
				},
			);
		}
		return item;
	});
	return result;
}
