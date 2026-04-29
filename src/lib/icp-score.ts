import type { Company, Signal } from './types'
import { icpWeights } from '../data/icp'

export interface IcpBreakdown {
  total: number
  band: 'high' | 'medium' | 'low'
  factors: Array<{ key: keyof typeof icpWeights; weight: number; matched: boolean; note: string }>
}

export function scoreSignal(signal: Signal, company: Company): IcpBreakdown {
  const factors: IcpBreakdown['factors'] = []

  const hasInternationalHiring =
    signal.type === 'HIRING_INTL' || signal.type === 'EXEC_HIRE'
  factors.push({
    key: 'hasInternationalHiringSignal',
    weight: icpWeights.hasInternationalHiringSignal,
    matched: hasInternationalHiring,
    note: hasInternationalHiring
      ? `Signal type ${signal.type} indicates international hiring intent.`
      : 'Signal type does not directly imply international hiring.',
  })

  const explicitExpansion =
    signal.type === 'EXPANSION' ||
    /expansion|launch|open(ing)? .* (office|store|market)|enter(ing)? /i.test(signal.detail)
  factors.push({
    key: 'hasExplicitExpansionLanguage',
    weight: icpWeights.hasExplicitExpansionLanguage,
    matched: explicitExpansion,
    note: explicitExpansion
      ? 'Detail contains explicit expansion or new-market language.'
      : 'No explicit expansion language detected.',
  })

  const fundingFit = /Series [B-Z]|PE-backed|profitable/i.test(company.fundingStage)
  factors.push({
    key: 'fundingStageSeriesBPlus',
    weight: icpWeights.fundingStageSeriesBPlus,
    matched: fundingFit,
    note: fundingFit
      ? `Funding stage "${company.fundingStage}" qualifies.`
      : 'Below Series B / not PE-backed / not bootstrapped-profitable.',
  })

  const midMarket = /mid-market/i.test(company.employeeBand)
  factors.push({
    key: 'employeeBandMidMarket',
    weight: icpWeights.employeeBandMidMarket,
    matched: midMarket,
    note: midMarket
      ? `Employee band "${company.employeeBand}" is in target.`
      : 'Outside target employee band.',
  })

  const noEntityInTarget = !company.existingEntities.some((c) =>
    signal.countryFocus.toLowerCase().includes(c.toLowerCase()),
  )
  factors.push({
    key: 'noEntityInTargetCountry',
    weight: icpWeights.noEntityInTargetCountry,
    matched: noEntityInTarget,
    note: noEntityInTarget
      ? `No existing entity in ${signal.countryFocus} — strong EOR fit.`
      : 'Entity already exists in target country (lower EOR fit).',
  })

  const regulated = /Diagnostics|Pay|Maritime|Robotics|Foods|Apparel/i.test(company.industry)
  factors.push({
    key: 'regulatedIndustry',
    weight: icpWeights.regulatedIndustry,
    matched: regulated,
    note: regulated
      ? `Industry "${company.industry}" carries compliance burden.`
      : 'Industry has lighter compliance burden.',
  })

  const execHire = signal.type === 'EXEC_HIRE'
  factors.push({
    key: 'recentExecHireWithGlobalRemit',
    weight: icpWeights.recentExecHireWithGlobalRemit,
    matched: execHire,
    note: execHire
      ? 'Recent executive appointment with international remit.'
      : 'No matching executive appointment in this signal.',
  })

  const hasEorElsewhere = company.existingEntities.length >= 2
  factors.push({
    key: 'alreadyHasEorElsewhere',
    weight: icpWeights.alreadyHasEorElsewhere,
    matched: hasEorElsewhere,
    note: hasEorElsewhere
      ? 'Already has multi-country entity footprint — known EOR-savvy.'
      : 'Single-country footprint today.',
  })

  const tooSmall = /small mid-market|< ?100/i.test(company.employeeBand)
  factors.push({
    key: 'smallTeamPenalty',
    weight: icpWeights.smallTeamPenalty,
    matched: tooSmall,
    note: tooSmall
      ? 'Small team — apply size penalty (route to Contractor product).'
      : 'No size penalty.',
  })

  const total = factors.reduce(
    (sum, f) => sum + (f.matched ? f.weight : 0),
    0,
  )
  const clamped = Math.max(0, Math.min(100, total))
  const band: IcpBreakdown['band'] = clamped >= 70 ? 'high' : clamped >= 45 ? 'medium' : 'low'
  return { total: clamped, band, factors }
}
