import {
  PATTERN_NUMBERS,
  WIN_COLORS,
  type PatternColorSelection,
  type PatternNumber,
  type WinColor,
} from '../../../domain/game/Game'

type PatternColorSettingProps = {
  value: Readonly<PatternColorSelection>
  error: string | null
  onChange: (patternNumber: PatternNumber, color: WinColor | null) => void
}

const colorLabels: Record<WinColor, string> = {
  red: '赤',
  blue: '青',
  yellow: '黄',
}

/** ゲーム開始前に、図柄1～6を赤・青・黄へ重複なく割り当てる設定UIです。 */
export function PatternColorSetting({ value, error, onChange }: PatternColorSettingProps) {
  return (
    <fieldset className="pattern-color-setting">
      <legend>図柄の色設定</legend>
      <p className="pattern-color-description">
        各サムネイルに赤・青・黄のいずれかを割り当ててください。<br />
        色ごとに、昇格確率が異なります。
      </p>

      {/* 図柄を一度だけ並べ、各カード内で割り当てる色を選択します。 */}
      <div className="pattern-thumbnail-grid">
        {PATTERN_NUMBERS.map((patternNumber) => (
          <section className="pattern-thumbnail-card" key={patternNumber}>
            <h3>図柄 {patternNumber}</h3>
            <img
              className="pattern-thumbnail-image"
              src={`/pattern/member/${patternNumber}.png`}
              alt={`図柄 ${patternNumber}`}
            />
            <div className="pattern-color-choices" aria-label={`図柄${patternNumber}の色`}>
              {WIN_COLORS.map((color) => {
                const isSelected = value[patternNumber] === color
                return (
                  <button
                    type="button"
                    className={`pattern-color-choice pattern-color-choice--${color}${isSelected ? ' pattern-color-choice--selected' : ''}`}
                    aria-pressed={isSelected}
                    aria-label={`${colorLabels[color]}に図柄${patternNumber}を${isSelected ? '割り当て解除' : '割り当て'}`}
                    key={color}
                    onClick={() => onChange(patternNumber, isSelected ? null : color)}
                  >
                    <span className="pattern-color-swatch" aria-hidden="true" />
                    {colorLabels[color]}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <p
        id="pattern-color-message"
        className={`field-message${error ? ' field-message--error' : ''}`}
        aria-live="polite"
      >
        {error ?? '各数字は1色にだけ割り当てられます'}
      </p>
    </fieldset>
  )
}
