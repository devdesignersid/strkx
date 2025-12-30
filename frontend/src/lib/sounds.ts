/**
 * Sound effects utility for the application.
 * Plays audio feedback for success/failure events.
 */

// Preload audio elements for instant playback
const successSound = new Audio('/sounds/game-level-complete.mp3');
const failureSound = new Audio('/sounds/game-over.mp3');

// Preload the sounds
successSound.load();
failureSound.load();

export const sounds = {
    /**
     * Play success sound (cash register) for passed tests
     */
    playSuccess: () => {
        successSound.currentTime = 0;
        successSound.play().catch(() => {
            // Ignore autoplay restrictions
        });
    },

    /**
     * Play failure sound (game over) for failed tests
     */
    playFailure: () => {
        failureSound.currentTime = 0;
        failureSound.play().catch(() => {
            // Ignore autoplay restrictions
        });
    }
};
