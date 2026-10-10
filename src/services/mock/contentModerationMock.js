// Demo moderation data for ADM-035 → ADM-037 (VITE_USE_MOCK_CONTENT=true).
// Records are shaped like `content_moderation` documents; images live in
// public/demo/content (see CREDITS.md there).

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const IMG = (name) => `/demo/content/${name}.jpg`

const REVIEWERS = [{ id: 'adm-jane', name: 'Jane Ochieng' }, { id: 'adm-kevin', name: 'Kevin Mutua' }, { id: 'adm-aisha', name: 'Aisha Noor' }]

const PROFESSIONALS = [
  ['PR-82941', 'Grace Njeri', 'massage_therapist', 'grace-njeri', 'KE', 'Nairobi', 4.9, 128, 4500],
  ['PR-71204', 'Amina Wekesa', 'yoga_specialist', 'amina-wekesa', 'KE', 'Kilimani', 4.8, 96, 3500],
  ['PR-66310', 'Brian Otieno', 'fitness_trainer', 'brian-otieno', 'KE', 'Westlands', 4.7, 210, 4000],
  ['PR-55102', 'Peter Kamau', 'physiotherapist', 'peter-kamau', 'UG', 'Kampala', 4.6, 74, 120000],
  ['PR-48210', 'Naomi Chebet', 'meditation_specialist', 'naomi-chebet', 'KE', 'Karen', 4.9, 58, 2500],
  ['PR-39911', 'Lucy Wanjiru', 'massage_therapist', 'lucy-wanjiru', 'TZ', 'Dar es Salaam', 4.5, 41, 95000],
  ['PR-31007', 'Daniel Okoth', 'yoga_specialist', 'daniel-okoth', 'KE', 'Mombasa', 4.7, 63, 3000],
  ['PR-28816', 'Mercy Wairimu', 'physiotherapist', 'mercy-wairimu', 'RW', 'Kigali', 4.8, 88, 45000],
  ['PR-22140', 'Joy Akinyi', 'massage_therapist', 'joy-akinyi', 'ZA', 'Cape Town', 4.6, 37, 650],
]
const BUSINESSES = [
  ['SPA-28192', 'Serenity Wellness Spa', 'spa', 'KE', 'Westlands, Nairobi', 'Westlands Branch'],
  ['SPA-19433', 'Radiance Day Spa', 'spa', 'KE', 'Kilimani, Nairobi', 'Kilimani Branch'],
  ['HTL-40771', 'Savanna Wellness Resort', 'hotel_resort', 'KE', 'Naivasha', 'Wellness Pavilion'],
  ['SPA-50218', 'Zuri Day Spa', 'spa', 'UG', 'Kampala', 'Kololo Branch'],
  ['HTL-61890', 'The Lotus Retreat', 'hotel_resort', 'TZ', 'Zanzibar', 'Ocean Spa'],
  ['HTL-73302', 'Mountainside Wellness', 'hotel_resort', 'KE', 'Nanyuki', 'Mountain Spa'],
]

const SPA_MEDIA = [
  ['Reception Area', 'gallery', 'relaxation-bath'],
  ['Treatment Room', 'gallery', 'massage-room'],
  ['Sauna Room', 'facilities', 'sauna'],
  ['Wellness Lounge', 'gallery', 'wellness-lounge'],
  ['Swimming Pool', 'facilities', 'resort-pool'],
  ['Massage Room', 'gallery', 'hot-stone'],
  ['Fitness Area', 'facilities', 'fitness'],
  ['Steam Room', 'facilities', 'unrelated-clinic'],
  ['Spa Products', 'services', 'spa-products'],
  ['Facial Treatment', 'services', 'facial'],
  ['Exterior View', 'gallery', 'suite'],
  ['Relaxation Area', 'wellness_locations', 'treatment-suite'],
]

const PLACEMENTS = {
  profile_photo: ['Professional Profile', 'Search Results', 'Nearby Results'],
  gallery: ['Spa Profile Gallery', 'Spa Amenities', 'Search Results'],
  service: ['Service Listing', 'Provider Profile', 'Search Results'],
  business_profile: ['Business Profile', 'Search Results'],
  offer: ['Offers Feed', 'Business Profile'],
  package: ['Packages', 'Business Profile'],
  other: ['Provider Profile'],
}

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const iso = (ms) => new Date(ms).toISOString()
const pro = ([ref, name, type, photo, cc, city, rating, reviews, price]) => ({
  providerId: ref, providerRef: ref, providerName: name, providerType: type, providerVerified: true, providerCity: city, providerPhotoUrl: IMG(photo),
  providerRating: rating, providerReviewCount: reviews, providerPrice: price, countryCode: cc,
})
const biz = ([ref, name, type, cc, city]) => ({ providerId: ref, providerRef: ref, providerName: name, providerType: type, providerVerified: true, providerCity: city, countryCode: cc })

function galleryMedia(now, statuses, branch) {
  return SPA_MEDIA.map(([title, category, img], i) => ({
    mediaId: `MED-${82930 + i}`,
    title,
    category,
    url: IMG(img),
    width: 2400,
    height: 1600,
    sizeBytes: Math.round((1.4 + (i % 5) * 0.2) * 1024 * 1024),
    format: 'JPG',
    status: statuses[i] || 'awaiting_review',
    version: i === 2 || i === 5 ? 2 : 1,
    position: i + 1,
    relatedEntity: category === 'facilities' ? { type: 'Facility', name: title.replace(' Room', '').replace(' Area', '') } : category === 'services' ? { type: 'Service', name: title } : null,
    branch,
    placements: category === 'facilities' ? ['Spa Amenities', 'Spa Profile Gallery'] : category === 'services' ? ['Service Listing', 'Spa Profile Gallery'] : ['Spa Profile Gallery', 'Search Results'],
    peopleVisible: img === 'facial' || img === 'hot-stone',
    consent: img === 'facial' ? 'satisfied' : img === 'hot-stone' ? 'review' : null,
    uploadedAt: iso(now - 2 * HOUR),
    versions: i === 2 ? [{ version: 1, status: 'changes_requested', reason: 'Image quality too low', url: IMG('sauna'), submittedAt: iso(now - 2 * DAY) }]
      : i === 5 ? [{ version: 1, status: 'changes_requested', reason: 'Image contained visible phone number', url: IMG('hot-stone'), submittedAt: iso(now - 3 * DAY) }] : [],
    ...(statuses[i] && statuses[i] !== 'awaiting_review' && statuses[i] !== 'under_review'
      ? { decision: { decision: { approved: 'approve', changes_requested: 'request_changes', rejected: 'reject' }[statuses[i]], reason: statuses[i] === 'rejected' ? 'Content unrelated to wellness services' : statuses[i] === 'changes_requested' ? 'Poor crop' : null, by: REVIEWERS[0], at: iso(now - 40 * MIN) } }
      : {}),
  }))
}

// Hand-written records matching the ADM-035/036/037 mockups.
function seeded(now) {
  const grace = pro(PROFESSIONALS[0])
  return [
    ['CNT-82941', {
      ...grace, contentId: 'CNT-82941', contentType: 'profile_photo', title: 'Profile Photo', status: 'awaiting_review', priority: 'normal', contentVersion: 2, resubmitted: true,
      submittedAt: iso(now - 95 * MIN), placements: PLACEMENTS.profile_photo,
      media: [{ mediaId: 'MED-82941', title: 'Profile Photo', category: 'profile', url: IMG('grace-njeri'), width: 1200, height: 1200, sizeBytes: 2.4 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 2, uploadedAt: iso(now - 95 * MIN) }],
      previousVersions: [{ version: 1, status: 'changes_requested', reason: 'Image quality too low', submittedAt: iso(now - 2 * DAY - 70 * MIN), url: IMG('grace-njeri-v1') }],
      history: [
        ['Profile photo submitted (Version 1)', now - 2 * DAY - 70 * MIN, null],
        ['Changes requested — Image quality too low', now - 2 * DAY - 20 * MIN, REVIEWERS[0]],
        ['New profile photo submitted (Version 2)', now - 95 * MIN, null],
      ],
      notes: [],
    }],
    ['CNT-72819', {
      ...biz(BUSINESSES[0]), contentId: 'CNT-72819', contentType: 'gallery', contentLabel: 'Spa Gallery', title: 'Spa Gallery', status: 'under_review', priority: 'high', contentVersion: 2,
      assignedTo: REVIEWERS[0], reviewStartedAt: iso(now - 40 * MIN), submittedAt: iso(now - 3 * HOUR), placements: PLACEMENTS.gallery,
      media: galleryMedia(now, ['approved', 'approved', 'under_review', 'awaiting_review', 'approved', 'changes_requested', 'approved', 'rejected', 'approved', 'awaiting_review', 'approved', 'awaiting_review'], BUSINESSES[0][5]),
      history: [
        ['Initial gallery submitted (Version 1)', now - 2 * DAY, null],
        ['Changes requested — Image quality too low', now - 2 * DAY + 50 * MIN, REVIEWERS[0]],
        ['Gallery resubmitted (Version 2)', now - 3 * HOUR, null],
        ['Assigned to Jane Ochieng', now - 50 * MIN, REVIEWERS[1]],
        ['Review started', now - 40 * MIN, REVIEWERS[0]],
      ],
      notes: [{ text: 'High quality images overall. Steam room photo shows an unrelated clinic — rejected.', authorName: 'Jane Ochieng', createdAt: iso(now - 30 * MIN) }],
    }],
    ['CNT-62811', {
      ...biz(BUSINESSES[2]), contentId: 'CNT-62811', contentType: 'service', title: 'Service Description', status: 'resubmitted', priority: 'normal', contentVersion: 2, resubmitted: true,
      submittedAt: iso(now - 20 * HOUR), placements: PLACEMENTS.service,
      service: { name: 'Couples Massage', description: 'A relaxing side-by-side massage for two in our private couples suite, using warm aromatherapy oils to release tension and restore balance.', durationMins: 90, price: 14000, category: 'Massage', imageUrl: IMG('spa-treatment') },
      media: [{ mediaId: 'MED-62811', title: 'Service Image', category: 'services', url: IMG('spa-treatment'), width: 1800, height: 1200, sizeBytes: 1.6 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 2 }],
      previousVersions: [{ version: 1, status: 'changes_requested', reason: 'Unsupported claim — "cures chronic pain"', submittedAt: iso(now - 4 * DAY) }],
      history: [['Service content submitted (Version 1)', now - 4 * DAY, null], ['Changes requested — Unsupported claim', now - 3 * DAY, REVIEWERS[2]], ['Service content resubmitted (Version 2)', now - 20 * HOUR, null]],
      notes: [],
    }],
    ['CNT-51733', {
      ...biz(BUSINESSES[3]), contentId: 'CNT-51733', contentType: 'offer', title: 'Offer Image', status: 'changes_requested', priority: 'high', contentVersion: 1,
      submittedAt: iso(now - 22 * HOUR), reviewedAt: iso(now - 5 * HOUR), reviewedBy: REVIEWERS[1], decision: 'request_changes', reason: 'Promotional information incomplete', providerMessage: 'Please add the offer validity dates and the eligible services.', placements: PLACEMENTS.offer,
      offer: { title: 'Midweek Glow Facial', description: '25% off our signature facial every Tuesday and Wednesday.', originalPrice: 180000, offerPrice: 135000, validFrom: null, validTo: null, eligibleServices: ['Signature Facial'], location: 'Kololo Branch', imageUrl: IMG('facial-mask') },
      media: [{ mediaId: 'MED-51733', title: 'Promotional Image', category: 'services', url: IMG('facial-mask'), width: 1600, height: 1067, sizeBytes: 1.1 * 1024 * 1024, format: 'JPG', status: 'changes_requested', version: 1 }],
      history: [['Offer submitted', now - 22 * HOUR, null], ['Changes requested — Promotional information incomplete', now - 5 * HOUR, REVIEWERS[1]]],
      notes: [],
    }],
  ]
}

const TEMPLATES = [
  (r, now, i) => {
    const p = PROFESSIONALS[1 + (i % (PROFESSIONALS.length - 1))]
    return { ...pro(p), contentType: 'profile_photo', title: 'Profile Photo', media: [{ mediaId: `MED-${i}`, title: 'Profile Photo', category: 'profile', url: IMG(i % 7 === 3 ? 'casual-hoodie' : p[3]), width: i % 5 === 0 ? 640 : 1200, height: i % 5 === 0 ? 800 : 1200, sizeBytes: 1.8 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 1 }] }
  },
  (r, now, i) => {
    const b = BUSINESSES[1 + (i % (BUSINESSES.length - 1))]
    const imgs = [['Treatment Room', 'massage-oil'], ['Wellness Lounge', 'wellness-lounge'], ['Pool Deck', 'resort-pool'], ['Suite', 'hotel-room']]
    return { ...biz(b), contentType: 'gallery', contentLabel: b[2] === 'hotel_resort' ? 'Wellness Gallery' : 'Spa Gallery', title: b[2] === 'hotel_resort' ? 'Wellness Gallery' : 'Spa Gallery', media: imgs.map(([title, img], k) => ({ mediaId: `MED-${i}${k}`, title, category: k === 2 ? 'facilities' : 'gallery', url: IMG(img), width: 2000, height: 1333, sizeBytes: 1.5 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 1, branch: b[5], placements: ['Spa Profile Gallery'] })) }
  },
  (r, now, i) => {
    const p = PROFESSIONALS[i % PROFESSIONALS.length]
    const svc = [['Deep Tissue Massage', 'massage-oil', 'Massage', 60], ['Sunrise Yoga Flow', 'yoga-sunset', 'Yoga', 60], ['Guided Meditation', 'meditation', 'Meditation', 45], ['Personal Training', 'fitness', 'Fitness', 60]][i % 4]
    return { ...pro(p), contentType: 'service', title: 'Service Content', service: { name: svc[0], description: `A ${svc[2].toLowerCase()} session delivered by a verified Lé Inspa professional, tailored to your goals and comfort.`, durationMins: svc[3], price: p[8], category: svc[2], imageUrl: IMG(svc[1]) }, media: [{ mediaId: `MED-${i}`, title: 'Service Image', category: 'services', url: IMG(svc[1]), width: 1800, height: 1200, sizeBytes: 1.3 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 1 }] }
  },
  (r, now, i) => {
    const b = BUSINESSES[i % BUSINESSES.length]
    return { ...biz(b), contentType: 'business_profile', title: 'Business Logo', business: { description: `${b[1]} offers premium massage, facial and wellness therapies in ${b[4]}.`, logoUrl: IMG('spa-products') }, media: [{ mediaId: `MED-${i}`, title: 'Logo / Cover', category: 'gallery', url: IMG(i % 2 ? 'aromatherapy' : 'spa-products'), width: 1200, height: 800, sizeBytes: 0.9 * 1024 * 1024, format: 'PNG', status: 'awaiting_review', version: 1 }] }
  },
  (r, now, i) => {
    const b = BUSINESSES[i % BUSINESSES.length]
    const pkg = r() < 0.5
    return { ...biz(b), contentType: pkg ? 'package' : 'offer', title: pkg ? 'Package Content' : 'Offer Image', offer: { title: pkg ? 'Weekend Wellness Escape' : 'Hot Stone Special', description: pkg ? 'Two nights with daily yoga, a hot stone massage and detox menu.' : '20% off hot stone therapy this month.', originalPrice: 9000, offerPrice: 7200, validFrom: iso(now), validTo: iso(now + 30 * DAY), eligibleServices: ['Hot Stone Therapy'], location: b[5], imageUrl: IMG(pkg ? 'yoga-group' : 'hot-stone') }, media: [{ mediaId: `MED-${i}`, title: 'Promotional Image', category: 'services', url: IMG(pkg ? 'yoga-group' : 'hot-stone'), width: 1600, height: 1067, sizeBytes: 1.2 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 1 }] }
  },
  (r, now, i) => {
    const b = BUSINESSES[i % BUSINESSES.length]
    return { ...biz(b), contentType: 'other', title: 'Staff Photo', media: [{ mediaId: `MED-${i}`, title: 'Staff Photo', category: 'gallery', url: IMG(i % 2 ? 'salon' : 'unrelated-makeup'), width: 1400, height: 933, sizeBytes: 1 * 1024 * 1024, format: 'JPG', status: 'awaiting_review', version: 1 }] }
  },
]

const STATUS_POOL = ['awaiting_review', 'awaiting_review', 'awaiting_review', 'under_review', 'resubmitted', 'changes_requested', 'approved', 'approved', 'approved', 'rejected', 'escalated']

function generated(now, count = 64) {
  return Array.from({ length: count }, (_, k) => {
    const i = k + 1
    const r = rng(i * 7919 + 13)
    const t = TEMPLATES[Math.floor(r() * TEMPLATES.length)](r, now, i)
    const status = STATUS_POOL[Math.floor(r() * STATUS_POOL.length)]
    const decided = ['approved', 'rejected', 'changes_requested'].includes(status)
    const reviewer = REVIEWERS[Math.floor(r() * REVIEWERS.length)]
    const submittedAt = now - Math.floor((0.5 + r() * 22) * HOUR)
    const id = `CNT-${String(70000 - i * 431).padStart(5, '0')}`
    const doc = {
      ...t,
      contentId: id,
      status,
      priority: r() < 0.12 ? 'urgent' : r() < 0.3 ? 'high' : r() < 0.9 ? 'normal' : 'low',
      contentVersion: status === 'resubmitted' ? 2 : 1,
      submittedAt: iso(submittedAt),
      placements: PLACEMENTS[t.contentType],
      ...(status === 'under_review' || status === 'escalated' || (decided && r() < 0.6) ? { assignedTo: reviewer } : {}),
      ...(decided ? { reviewedAt: iso(Math.min(now - 10 * MIN, submittedAt + Math.floor(r() * 10 * HOUR))), reviewedBy: reviewer, decision: { approved: 'approve', rejected: 'reject', changes_requested: 'request_changes' }[status], reason: status === 'approved' ? null : status === 'rejected' ? 'Content unrelated to wellness services' : 'Image quality too low' } : {}),
      ...(status === 'escalated' ? { escalation: { team: 'trust_safety', reason: 'Complex policy interpretation', at: iso(now - 2 * HOUR) } } : {}),
      history: [[`${t.title} submitted`, submittedAt, null]],
      notes: [],
    }
    doc.media = (doc.media || []).map((m) => ({ ...m, status: decided || status === 'escalated' ? (status === 'changes_requested' ? 'changes_requested' : status) : m.status }))
    return [id, doc]
  })
}

let store = null
export function contentStore(now = Date.now()) {
  if (!store) {
    store = new Map()
    for (const [id, d] of [...seeded(now), ...generated(now)]) {
      const { history = [], notes = [], ...doc } = d
      store.set(id, {
        doc,
        history: history.map(([event, at, actor]) => ({ moderationId: id, event, at: iso(at), actor })),
        notes,
      })
    }
  }
  return store
}

export const MOCK_ADMIN = { id: 'adm-wallen', name: 'Wallen Nyaberi' }
