import {createAudioPlayer, setAudioModeAsync} from 'expo-audio';
import * as SecureStore from 'expo-secure-store';

const ENABLE_SOUNDS_STORAGE_KEY = 'enable_sounds';

export function getEnableSounds() {
    try {
        return SecureStore.getItem(ENABLE_SOUNDS_STORAGE_KEY) === 'on';
    } catch {
        return false;
    }
}

export function setEnableSounds(enabled) {
    SecureStore.setItem(ENABLE_SOUNDS_STORAGE_KEY, enabled ? 'on' : 'off');
}

let successPlayer = null;

export async function playScanSuccessSound() {
    if (!getEnableSounds()) {
        return;
    }

    if (!successPlayer) {
        // expo-audio plays through the silent switch by default; a scan sound shouldn't
        await setAudioModeAsync({playsInSilentMode: false});
        successPlayer = createAudioPlayer(require('@/assets/sounds/success.mp3'));
    }

    await successPlayer.seekTo(0);
    successPlayer.play();
}
