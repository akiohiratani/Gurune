import { parseProbabilityPercent } from '../../../application/probabilityPercent'
import { gameConfig } from '../../../config/gameConfig'

type ProbabilitySettingProps = {
  value: string
  disabled: boolean
  error: string | null
  onChange: (value: string) => void
}

function steppedValue(value: string, direction: -1 | 1): string {
  const current = Number(value)
  const base = Number.isFinite(current) ? current : 0
  const next = Math.min(100, Math.max(0, base + direction * gameConfig.probabilityStepPercent))
  return next.toFixed(1)
}

export function ProbabilitySetting({ value, disabled, error, onChange }: ProbabilitySettingProps) {
  const validation = parseProbabilityPercent(value)
  const message = error ?? (validation.valid ? null : validation.message)

  return (
    <fieldset className="probability-setting" disabled={disabled}>
      <legend>当選確率</legend>
      <div className="probability-control">
        <button type="button" className="step-button" aria-label="当選確率を0.1%下げる" title="0.1%下げる" onClick={() => onChange(steppedValue(value, -1))}>
          −
        </button>
        <label className="probability-input-wrap">
          <span className="sr-only">当選確率（パーセント）</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step={gameConfig.probabilityStepPercent}
            value={value}
            aria-invalid={message ? 'true' : 'false'}
            aria-describedby="probability-message"
            onChange={(event) => onChange(event.target.value)}
          />
          <span aria-hidden="true">%</span>
        </label>
        <button type="button" className="step-button" aria-label="当選確率を0.1%上げる" title="0.1%上げる" onClick={() => onChange(steppedValue(value, 1))}>
          ＋
        </button>
      </div>
      <p id="probability-message" className={`field-message${message ? ' field-message--error' : ''}`} aria-live="polite">
        {message ?? '0〜100%の範囲で設定'}
      </p>
    </fieldset>
  )
}
