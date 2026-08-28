import { ProbabilitySetting } from '../ProbabilitySetting/ProbabilitySetting'

type GameSettingsModalProps = {
  probabilityPercent: string
  continuationRatePercent: number | null
  error: string | null
  canStart: boolean
  onProbabilityChange: (value: string) => void
  onStart: () => void
}

export function GameSettingsModal({
  probabilityPercent,
  continuationRatePercent,
  error,
  canStart,
  onProbabilityChange,
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
        <p className="section-index">GAME SETUP / PROBABILITY</p>
        <h2 id="settings-modal-title">当選確率の設定</h2>
        <p id="settings-modal-description" className="settings-modal-description">
          1回の抽選における当選確率を設定してください。
        </p>

        <ProbabilitySetting
          value={probabilityPercent}
          disabled={false}
          error={error}
          onChange={onProbabilityChange}
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
