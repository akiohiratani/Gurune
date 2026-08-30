import {
  PRIZE_NAME_MAX_LENGTH,
  type PrizeInputValues,
  type PrizeNumber,
} from '../../../domain/prize/Prize'

type PrizeSettingProps = {
  value: Readonly<PrizeInputValues>
  error: string | null
  onChange: (prizeNumber: PrizeNumber, value: string) => void
}

const prizeNumbers = [1, 2, 3, 4, 5, 6] as const

export function PrizeSetting({ value, error, onChange }: PrizeSettingProps) {
  return (
    <fieldset className="prize-setting">
      <legend>景品設定</legend>
      <p className="prize-setting-description">
        ルーレットで抽選する6つの景品を入力してください。
      </p>

      <div className="prize-input-grid">
        {prizeNumbers.map((prizeNumber) => (
          <label className="prize-input-field" key={prizeNumber}>
            <span>景品{prizeNumber}</span>
            <input
              type="text"
              required
              maxLength={PRIZE_NAME_MAX_LENGTH}
              value={value[prizeNumber - 1]}
              aria-invalid={!value[prizeNumber - 1].trim() ? 'true' : 'false'}
              onChange={(event) => onChange(prizeNumber, event.target.value)}
            />
            <small>{Array.from(value[prizeNumber - 1]).length}/{PRIZE_NAME_MAX_LENGTH}</small>
          </label>
        ))}
      </div>

      <p
        id="prize-setting-message"
        className={`field-message${error ? ' field-message--error' : ''}`}
        aria-live="polite"
      >
        {error ?? '各景品は20文字まで入力できます'}
      </p>
    </fieldset>
  )
}
