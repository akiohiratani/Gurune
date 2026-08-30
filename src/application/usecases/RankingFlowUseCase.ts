import type { GameStatus, PatternNumber, WinRecord } from '../../domain/game/Game'
import {
  calculateGameRanking,
  decideCandidate,
  getPatternTotal,
  isTied,
  type GameRanking,
  type GameStanding,
  type PlaceResult,
} from '../../domain/ranking/GameRanking'
import type { RandomSource } from '../ports/RandomSource'

export type TiebreakKind = 'first' | 'last'

export type TiebreakRound = {
  kind: TiebreakKind
  candidates: readonly PatternNumber[]
  selectedPattern: PatternNumber
}

export type RankingFlowState = {
  ranking: GameRanking
  firstPlace: PlaceResult | null
  lastPlace: PlaceResult | null
  round: TiebreakRound | null
  status: Extract<GameStatus, 'FIRST_PLACE_TIEBREAK' | 'LAST_PLACE_TIEBREAK' | 'finished'>
}

export class RankingFlowUseCase {
  private readonly randomSource: RandomSource

  constructor(randomSource: RandomSource) {
    this.randomSource = randomSource
  }

  start(records: readonly WinRecord[]): RankingFlowState {
    const ranking = calculateGameRanking(records)
    const firstPlace = this.createAutomaticResult(ranking, 'first')
    const lastPlace = this.createAutomaticResult(ranking, 'last')

    if (!firstPlace) {
      return {
        ranking,
        firstPlace: null,
        lastPlace,
        round: this.createRound(ranking, 'first'),
        status: 'FIRST_PLACE_TIEBREAK',
      }
    }

    if (!lastPlace) {
      return {
        ranking,
        firstPlace,
        lastPlace: null,
        round: this.createRound(ranking, 'last'),
        status: 'LAST_PLACE_TIEBREAK',
      }
    }

    return { ranking, firstPlace, lastPlace, round: null, status: 'finished' }
  }

  completeRound(state: RankingFlowState): RankingFlowState {
    const round = state.round
    if (!round) return state

    const completedResult: PlaceResult = {
      patternNumber: round.selectedPattern,
      total: getPatternTotal(state.ranking, round.selectedPattern),
      decidedByTiebreak: true,
    }

    if (round.kind === 'first') {
      const firstPlace = completedResult
      if (!state.lastPlace) {
        return {
          ...state,
          firstPlace,
          round: this.createRound(state.ranking, 'last', firstPlace.patternNumber),
          status: 'LAST_PLACE_TIEBREAK',
        }
      }
      return { ...state, firstPlace, round: null, status: 'finished' }
    }

    return { ...state, lastPlace: completedResult, round: null, status: 'finished' }
  }

  toStanding(state: RankingFlowState): GameStanding | null {
    if (!state.firstPlace || !state.lastPlace) return null
    return { firstPlace: state.firstPlace, lastPlace: state.lastPlace }
  }

  private createAutomaticResult(
    ranking: GameRanking,
    kind: TiebreakKind,
  ): PlaceResult | null {
    const candidates = kind === 'first'
      ? ranking.firstPlaceCandidates
      : ranking.lastPlaceCandidates
    if (isTied(candidates)) return null

    const patternNumber = candidates[0]
    return {
      patternNumber,
      total: getPatternTotal(ranking, patternNumber),
      decidedByTiebreak: false,
    }
  }

  private createRound(
    ranking: GameRanking,
    kind: TiebreakKind,
    excludedPattern?: PatternNumber,
  ): TiebreakRound {
    const candidates = kind === 'first'
      ? ranking.firstPlaceCandidates
      : ranking.lastPlaceCandidates
    // 全図柄が同数の場合も、同じ図柄が1位と最下位を兼ねないようにします。
    const selectableCandidates = candidates.filter(
      (patternNumber) => patternNumber !== excludedPattern,
    )
    const drawCandidates = selectableCandidates.length > 0 ? selectableCandidates : candidates

    return {
      kind,
      candidates,
      selectedPattern: decideCandidate(drawCandidates, this.randomSource.next()),
    }
  }
}
