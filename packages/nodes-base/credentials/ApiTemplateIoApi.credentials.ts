import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class ApiTemplateIoApi implements ICredentialType {
	name = 'apiTemplateIoApi';
	displayName = 'APITemplate.Io API';
	documentationUrl = 'apiTemplateIo';
	properties = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
	];
}
