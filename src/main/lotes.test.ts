import { describe, expect, it } from 'vitest'
import {
  canonicalizeLotExp,
  formatLotDate,
  markingSourceTriples,
  normalizePN,
  parseLotDate,
  stripPnKitSuffix
} from './lotes'

describe('normalizePN', () => {
  it('strips kit suffix', () => {
    expect(stripPnKitSuffix('80060-1')).toBe('80060')
    expect(stripPnKitSuffix('80118-3')).toBe('80118')
    expect(stripPnKitSuffix('80046')).toBe('80046')
    expect(stripPnKitSuffix('20358')).toBe('20358')
  })

  it('maps 18606571 only when requested', () => {
    expect(normalizePN('18606571')).toBe('18606571')
    expect(normalizePN('18606571', { map18606571: true })).toBe('80118')
  })

  it('leaves dates and empty values', () => {
    expect(normalizePN('27/06/2024')).toBe('27/06/2024')
    expect(normalizePN('')).toBe(null)
    expect(normalizePN(null)).toBe(null)
  })
})

describe('lot dates', () => {
  it('parses DD/MM, MM/DD, dashes and unpadded days', () => {
    expect(formatLotDate(parseLotDate('26/08/2026'))).toBe('26/08/2026')
    expect(formatLotDate(parseLotDate('08/26/2026'))).toBe('26/08/2026')
    expect(formatLotDate(parseLotDate('13-08-2027'))).toBe('13/08/2027')
    expect(formatLotDate(parseLotDate('27/7/2026'))).toBe('27/07/2026')
    expect(formatLotDate(parseLotDate('03/31/2025'))).toBe('31/03/2025')
    expect(formatLotDate(parseLotDate('01/19/2025'))).toBe('19/01/2025')
    expect(formatLotDate(parseLotDate('30-01-2027'))).toBe('30/01/2027')
    expect(formatLotDate(parseLotDate('2026-08-26'))).toBe('26/08/2026')
    expect(formatLotDate(parseLotDate('2026/08/26'))).toBe('26/08/2026')
  })

  it('applies LN-specific expiry corrections', () => {
    expect(canonicalizeLotExp('extraido', '250428048', '06/08/2026')).toBe('26/08/2026')
    expect(canonicalizeLotExp('marcado', '240212010', '04/17/2025')).toBe('19/01/2025')
    expect(canonicalizeLotExp('marcado', '240223012', '04/17/2024')).toBe('17/04/2025')
    expect(canonicalizeLotExp('marcado', '240212011', '08/16/2025')).toBe('16/08/2025')
    expect(canonicalizeLotExp('marcado', '250616051', '30-01-2027')).toBe('30/01/2027')
    expect(canonicalizeLotExp('membrana', '251125001', '10-12-2026')).toBe('10/12/2028')
    expect(canonicalizeLotExp('membrana', '240208020', '27/06/2024')).toBe('30/01/2027')
    expect(canonicalizeLotExp('membrana', '240209012', '01/30/2026')).toBe('30/01/2026')
    expect(canonicalizeLotExp('membrana', '240123002', '27/7/2026')).toBe('27/07/2026')
    expect(canonicalizeLotExp('membrana', '250506015', '19-05-2028')).toBe('19/05/2028')
  })
})

describe('markingSourceTriples', () => {
  it('skips scrambled BN 1 lecturas', () => {
    expect(
      markingSourceTriples({
        NumBN_LM: 1,
        NumLectura_LM: 3,
        NumLectMarc: 1,
        PN_LM: '27/06/2024',
        PNM_LM: '27/06/2024'
      })
    ).toEqual({ marcado: null, membrana: null })
  })

  it('swaps BN 72 lectura 2 LM 1', () => {
    const src = markingSourceTriples({
      NumBN_LM: 72,
      NumLectura_LM: 2,
      NumLectMarc: 1,
      PN_LM: '20358',
      LN_LM: '240209012',
      Exp_LM: '01/30/2026',
      PNM_LM: '80046-3',
      LNM_LM: '240212011',
      ExpM_LM: '16/08/2025'
    })
    expect(src.marcado).toEqual({
      pn: '80046-3',
      ln: '240212011',
      exp: '16/08/2025'
    })
    expect(src.membrana).toEqual({
      pn: '20358',
      ln: '240209012',
      exp: '01/30/2026'
    })
  })
})
