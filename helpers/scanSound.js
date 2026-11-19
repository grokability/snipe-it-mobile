import {createAudioPlayer, setAudioModeAsync} from 'expo-audio';

let successPlayer = null;

export async function playScanSuccessSound() {
    if (!successPlayer) {
        // expo-audio plays through the silent switch by default; a scan sound shouldn't
        await setAudioModeAsync({playsInSilentMode: false});
        successPlayer = createAudioPlayer(require('@/assets/sounds/success.mp3'));
    }

    await successPlayer.seekTo(0);
    successPlayer.play();
}
