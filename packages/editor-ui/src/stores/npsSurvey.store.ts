import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useUIStore } from './ui.store';
import {
	SEVEN_DAYS_IN_MILLIS,
	SIX_MONTHS_IN_MILLIS,
	THREE_DAYS_IN_MILLIS,
	NPS_SURVEY_MODAL_KEY,
	CONTACT_PROMPT_MODAL_KEY,
} from '@/constants';
import { useRootStore } from './n8nRoot.store';
import type { IUserSettings, NpsSurveyState } from 'n8n-workflow';
import { useSettingsStore } from './settings.store';
import { updateNpsSurveyState } from '@/api/npsSurvey';
import type { IN8nPrompts } from '@/Interface';
import { getPromptsData } from '@/api/settings';

export const MAXIMUM_TIMES_TO_SHOW_SURVEY_IF_IGNORED = 3;

export const useNpsSurveyStore = defineStore('npsSurvey', () => {
	const rootStore = useRootStore();
	const uiStore = useUIStore();
	const settingsStore = useSettingsStore();

	const shouldShowNpsSurveyNext = ref<boolean>(false);
	const currentSurveyState = ref<NpsSurveyState | undefined>();
	const currentUserId = ref<string | undefined>();

	function setupNpsSurveyOnLogin(userId: string, settings?: IUserSettings): void {
		currentUserId.value = userId;

		if (settings) {
			setShouldShowNpsSurvey(settings);
		}
	}

	function setShouldShowNpsSurvey(settings: IUserSettings) {
		if (!settingsStore.isTelemetryEnabled) {
			shouldShowNpsSurveyNext.value = false;
			return;
		}

		currentSurveyState.value = settings.npsSurvey;
		const userActivated = Boolean(settings.userActivated);
		const userActivatedAt = settings.userActivatedAt;
		const lastShownAt = currentSurveyState.value?.lastShownAt;

		if (!userActivated || !userActivatedAt) {
			return;
		}

		const timeSinceActivation = Date.now() - userActivatedAt;
		if (timeSinceActivation < THREE_DAYS_IN_MILLIS) {
			return;
		}

		if (!currentSurveyState.value || !lastShownAt) {
			// user has activated but never seen the nps survey
			shouldShowNpsSurveyNext.value = true;
			return;
		}

		const timeSinceLastShown = Date.now() - lastShownAt;
		console.log('yo', Date.now(), timeSinceLastShown);
		if ('responded' in currentSurveyState.value && timeSinceLastShown < SIX_MONTHS_IN_MILLIS) {
			return;
		}
		if (
			'waitingForResponse' in currentSurveyState.value &&
			timeSinceLastShown < SEVEN_DAYS_IN_MILLIS
		) {
			return;
		}

		shouldShowNpsSurveyNext.value = true;
	}

	function resetNpsSurveyOnLogOut() {
		shouldShowNpsSurveyNext.value = false;
	}

	async function showNpsSurveyIfPossible() {
		if (!shouldShowNpsSurveyNext.value) {
			return;
		}

		uiStore.openModal(NPS_SURVEY_MODAL_KEY);
		shouldShowNpsSurveyNext.value = false;

		const updatedState: NpsSurveyState = {
			waitingForResponse: true,
			lastShownAt: Date.now(),
			ignoredCount: 0,
		};
		await updateNpsSurveyState(rootStore.getRestApiContext, updatedState);
		currentSurveyState.value = updatedState;
	}

	async function respondNpsSurvey() {
		if (!currentSurveyState.value) {
			return;
		}

		const updatedState: NpsSurveyState = {
			responded: true,
			lastShownAt: currentSurveyState.value.lastShownAt,
		};
		await updateNpsSurveyState(rootStore.getRestApiContext, updatedState);
		currentSurveyState.value = updatedState;
	}

	async function ignoreNpsSurvey() {
		if (!currentSurveyState.value) {
			return;
		}
		const state = currentSurveyState.value;
		const ignoredCount = 'ignoredCount' in state ? state.ignoredCount : 0;

		if (ignoredCount + 1 >= MAXIMUM_TIMES_TO_SHOW_SURVEY_IF_IGNORED) {
			await respondNpsSurvey();

			return;
		}

		const updatedState: NpsSurveyState = {
			waitingForResponse: true,
			lastShownAt: currentSurveyState.value.lastShownAt,
			ignoredCount: ignoredCount + 1,
		};
		await updateNpsSurveyState(rootStore.getRestApiContext, updatedState);
		currentSurveyState.value = updatedState;
	}

	async function fetchPromptsData(): Promise<void> {
		if (!settingsStore.isTelemetryEnabled) {
			return;
		}

		const promptsData: IN8nPrompts = await getPromptsData(
			settingsStore.settings.instanceId,
			currentUserId.value ?? '',
		);

		if (promptsData?.showContactPrompt) {
			uiStore.openModal(CONTACT_PROMPT_MODAL_KEY);
		} else {
			await useNpsSurveyStore().showNpsSurveyIfPossible();
		}
	}

	return {
		resetNpsSurveyOnLogOut,
		showNpsSurveyIfPossible,
		ignoreNpsSurvey,
		respondNpsSurvey,
		setupNpsSurveyOnLogin,
		fetchPromptsData,
	};
});