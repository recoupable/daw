/**
 * AudioMixer.ts
 *
 * Centralized audio mixing system for the DAW
 * Inspired by professional DAW architectures like Ardour
 */

import * as Tone from 'tone';

export interface AudioSourceOptions {
  gain?: number; // Volume level (0-1)
  pan?: number; // Stereo panning (-1 to 1)
  fadeIn?: number; // Fade-in time in seconds
  fadeOut?: number; // Fade-out time in seconds
  solo?: boolean; // Whether this source is soloed
  mute?: boolean; // Whether this source is muted
}

export interface AudioSource {
  id: string; // Unique identifier for the source
  source: Tone.ToneAudioNode; // The audio source node
  gain: Tone.Gain; // Volume control for this source
  panner: Tone.Panner; // Panning control for this source
  startTime: number; // When this source started (in Tone.now() time)
  options: AudioSourceOptions;
}

export class AudioMixer {
  // Master output chain
  private masterOutput: Tone.Gain;

  // Mixing bus where all sources are summed
  private mixingBus: Tone.Gain;

  // Active audio sources
  private activeSources: Map<string, AudioSource>;

  // Limiter to prevent clipping
  private limiter: Tone.Limiter;

  // Whether the mixer is muted
  private _muted = false;

  constructor() {
    // Create a limiter to prevent output clipping
    this.limiter = new Tone.Limiter(-0.5).toDestination();

    // Create master output chain
    this.masterOutput = new Tone.Gain(0.9).connect(this.limiter);

    // Create mixing bus that feeds into the master
    this.mixingBus = new Tone.Gain(1).connect(this.masterOutput);

    // Initialize sources map
    this.activeSources = new Map();

    // Ensure Tone.js is properly initialized
    this._initializeTone();
  }

  /**
   * Ensure Tone.js audio context is properly initialized
   */
  private async _initializeTone(): Promise<void> {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('[AudioMixer] Tone.js audio context started');
      }
    } catch (error) {
      console.error('[AudioMixer] Failed to initialize Tone.js:', error);
    }
  }

  /**
   * Add an audio source to the mixer
   */
  public addSource(
    id: string,
    sourceNode: Tone.ToneAudioNode,
    options: AudioSourceOptions = {},
  ): AudioSource {
    // Apply default options
    const sourceOptions: AudioSourceOptions = {
      gain: options.gain ?? 0.8,
      pan: options.pan ?? 0,
      fadeIn: options.fadeIn ?? 0.01,
      fadeOut: options.fadeOut ?? 0.01,
      solo: options.solo ?? false,
      mute: options.mute ?? false,
    };

    // Create gain node for volume control
    const gain = new Tone.Gain(this._muted ? 0 : sourceOptions.gain);

    // Create panner for stereo positioning
    const panner = new Tone.Panner(sourceOptions.pan);

    // Connect the audio chain
    sourceNode.connect(gain);
    gain.connect(panner);
    panner.connect(this.mixingBus);

    // If a fadeIn is specified, start at zero and ramp up
    if ((sourceOptions.fadeIn ?? 0) > 0) {
      gain.gain.value = 0;
      gain.gain.rampTo(sourceOptions.gain ?? 1, sourceOptions.fadeIn ?? 0);
    }

    // Create the source object
    const source: AudioSource = {
      id,
      source: sourceNode,
      gain,
      panner,
      startTime: Tone.now(),
      options: sourceOptions,
    };

    // Add to active sources
    this.activeSources.set(id, source);

    // Update mixer gain to accommodate the new source
    this._updateMixingGain();

    return source;
  }

  /**
   * Remove a source from the mixer
   */
  public removeSource(id: string): void {
    const source = this.activeSources.get(id);
    if (!source) return;

    const fadeOutTime = source.options.fadeOut ?? 0.01;

    // Apply fade out to prevent clicks
    source.gain.gain.rampTo(0, fadeOutTime);

    // Disconnect and clean up after the fade out
    setTimeout(
      () => {
        try {
          source.source.disconnect();
          source.gain.disconnect();
          source.panner.disconnect();
          this.activeSources.delete(id);

          // Update mixer gain after removing the source
          this._updateMixingGain();

          console.log(`[AudioMixer] Source ${id} removed and disconnected`);
        } catch (error) {
          console.error(`[AudioMixer] Error cleaning up source ${id}:`, error);
        }
      },
      fadeOutTime * 1000 + 50,
    ); // Add a small buffer time
  }

  /**
   * Get all currently active sources
   */
  public getActiveSources(): Map<string, AudioSource> {
    return this.activeSources;
  }

  /**
   * Set the gain (volume) for a specific source
   */
  public setSourceGain(id: string, gain: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.options.gain = gain;
      if (!this._muted) {
        source.gain.gain.rampTo(gain, 0.05);
      }
    }
  }

  /**
   * Set the pan position for a specific source
   */
  public setSourcePan(id: string, pan: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.options.pan = pan;
      source.panner.pan.value = pan;
    }
  }

  /**
   * Mute or unmute a specific source
   */
  public setSourceMute(id: string, muted: boolean): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.options.mute = muted;
      this._updateSourceGain(source);
    }
  }

  /**
   * Solo or unsolo a specific source
   */
  public setSourceSolo(id: string, solo: boolean): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.options.solo = solo;
      this._updateAllSourceGains();
    }
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    this.masterOutput.gain.rampTo(Math.max(0, Math.min(1, volume)), 0.05);
  }

  /**
   * Mute the entire mixer
   */
  public setMute(muted: boolean): void {
    this._muted = muted;
    this._updateAllSourceGains();
  }

  /**
   * Stop and clean up all sources
   */
  public clearAllSources(): void {
    const sources = Array.from(this.activeSources.keys());
    sources.forEach((id) => this.removeSource(id));
  }

  /**
   * Update gain for a single source based on mute/solo status
   */
  private _updateSourceGain(source: AudioSource): void {
    // Check if any source is soloed
    const anySolo = Array.from(this.activeSources.values()).some(
      (s) => s.options.solo,
    );

    // Determine if this source should be heard
    const shouldBeMuted =
      this._muted || source.options.mute || (anySolo && !source.options.solo);

    // Set the appropriate gain
    const targetGain = shouldBeMuted ? 0 : (source.options.gain ?? 1);
    source.gain.gain.rampTo(targetGain, 0.05);
  }

  /**
   * Update gain for all sources based on mute/solo status
   */
  private _updateAllSourceGains(): void {
    for (const source of this.activeSources.values()) {
      this._updateSourceGain(source);
    }
  }

  /**
   * Dynamically adjust mixer gain to prevent clipping
   * when multiple sources are playing
   */
  private _updateMixingGain(): void {
    const count = this.activeSources.size;
    let targetGain = 1;

    if (count > 1) {
      // Progressive reduction as more sources are added
      // Using a logarithmic curve to sound more natural
      targetGain = 1 / (1 + Math.log(count) * 0.25);
    }

    // Apply the gain change gradually
    this.mixingBus.gain.rampTo(targetGain, 0.1);
  }

  /**
   * Clean up and dispose resources
   */
  public dispose(): void {
    this.clearAllSources();

    // Give time for sources to clean up, then disconnect mixer components
    setTimeout(() => {
      try {
        this.mixingBus.disconnect();
        this.masterOutput.disconnect();
        this.limiter.disconnect();

        console.log('[AudioMixer] All resources disposed');
      } catch (error) {
        console.error('[AudioMixer] Error disposing resources:', error);
      }
    }, 200);
  }
}
