import type {
  PatternColorSelection,
  PatternNumber,
  WinColor,
} from '../../../domain/game/Game'
import { PatternColorSetting } from '../PatternColorSetting/PatternColorSetting'
import { ProbabilitySetting } from '../ProbabilitySetting/ProbabilitySetting'

type GameSettingsModalProps = {
  probabilityPercent: string
  continuationRatePercent: number | null
  patternColorSelection: Readonly<PatternColorSelection>
  patternColorError: string | null
  error: string | null
  canStart: boolean
  onProbabilityChange: (value: string) => void
  onPatternColorChange: (patternNumber: PatternNumber, color: WinColor | null) => void
  onStart: () => void
}

export function GameSettingsModal({
  probabilityPercent,
  continuationRatePercent,
  patternColorSelection,
  patternColorError,
  error,
  canStart,
  onProbabilityChange,
  onPatternColorChange,
  onStart,
}: GameSettingsModalProps) {
  return (
    <div className="settings-modal-backdrop">
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-description"
      >
        <p className="section-index">GAME SETUP / SETTINGS</p>
        <h2 id="settings-modal-title">ゲーム設定</h2>
        <p id="settings-modal-description" className="settings-modal-description">
          当選確率と、図柄ごとの色を設定してください。
        </p>

        <ProbabilitySetting
          value={probabilityPercent}
          disabled={false}
          error={error}
          onChange={onProbabilityChange}
        />

        <PatternColorSetting
          value={patternColorSelection}
          error={patternColorError}
          onChange={onPatternColorChange}
        />

        <div className="continuation-rate" aria-live="polite">
          <span>3回抽選時の継続率</span>
          <strong>
            {continuationRatePercent === null ? '—' : `${continuationRatePercent}%`}
          </strong>
          <small>1 − (1 − 1回あたりの当選確率)³</small>
        </div>

        <button
          type="button"
          className="primary-action settings-modal-start"
          disabled={!canStart}
          onClick={onStart}
        >
          <span>この設定で開始</span>
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  )
}
