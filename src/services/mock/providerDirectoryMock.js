// Master Mock Dataset & Query Engine for ADM-021: Provider Directory
// Contains authentic provider records matching platform PRD and screenshot mockup.

export const DIRECTORY_PROVIDERS = [
  {
    id: 'PR-82941',
    dbId: 'prv-82941',
    name: 'Grace Njeri',
    entityType: 'individual',
    typeId: 'massage_therapist',
    typeLabel: 'Massage Therapist',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: 'New profile photo awaiting review',
    attentionCount: 1,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 3:30 PM',
    rating: 4.9,
    reviewCount: 126,
    bookings: 284,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    email: 'grace.njeri@wellness.co.ke',
    phone: '+254 722 849 201',
    joinedDate: '12 May 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '12 Oct 2026',
    activity: {
      totalBookings: 284,
      upcomingBookings: 12,
      completionRate: '96%',
      cancellationRate: '2.1%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Approved',
      profileInfo: 'Approved',
      profilePhoto: 'Awaiting Review',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-1', name: 'Deep Tissue Massage', duration: '60 min', price: 'KES 4,500', active: true },
      { id: 'srv-2', name: 'Swedish Relaxation Massage', duration: '90 min', price: 'KES 6,000', active: true },
      { id: 'srv-3', name: 'Hot Stone Therapy', duration: '75 min', price: 'KES 7,200', active: true },
      { id: 'srv-4', name: 'Aromatherapy Session', duration: '60 min', price: 'KES 5,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-48291', service: 'Deep Tissue Massage', client: 'Sarah Kamau', date: 'Today, 2:00 PM', price: 'KES 4,500', status: 'Confirmed' },
      { id: 'LI-48190', service: 'Swedish Relaxation', client: 'David Njoroge', date: 'Yesterday, 4:30 PM', price: 'KES 6,000', status: 'Completed' },
      { id: 'LI-48011', service: 'Hot Stone Therapy', client: 'Wanjiru Muthoni', date: '08 Oct 2026', price: 'KES 7,200', status: 'Completed' },
    ],
  },
  {
    id: 'SPA-28192',
    dbId: 'spa-28192',
    name: 'Serenity Wellness Spa',
    entityType: 'spa',
    typeId: 'spa',
    typeLabel: 'Spa & Wellness Center',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'open_now',
    availabilityLabel: 'Open Now',
    locationCount: 3,
    locationBadge: '3 Branches',
    operatingHours: 'Mon - Sun • 8:00 AM - 9:00 PM',
    rating: 4.8,
    reviewCount: 342,
    bookings: 1420,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=160&auto=format&fit=crop&q=80',
    email: 'contact@serenityspa.co.ke',
    phone: '+254 20 491 8200',
    joinedDate: '18 Jan 2025',
    subscriptionPlan: 'Enterprise Spa Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '24 Nov 2026',
    businessStructure: {
      branches: 3,
      staff: 18,
      services: 24,
      resources: 12,
    },
    activity: {
      totalBookings: 1420,
      upcomingBookings: 46,
      completionRate: '98%',
      cancellationRate: '1.2%',
    },
    verificationChecklist: {
      businessRegistration: 'Approved',
      commercialLease: 'Approved',
      healthSanitation: 'Approved',
      staffCertifications: 'Approved',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-spa-1', name: 'Signature Hydrotherapy Circuit', duration: '90 min', price: 'KES 8,500', active: true },
      { id: 'srv-spa-2', name: 'Couples Luxury Escape Massage', duration: '120 min', price: 'KES 16,000', active: true },
      { id: 'srv-spa-3', name: 'Purifying Botanical Facial', duration: '60 min', price: 'KES 5,500', active: true },
    ],
    recentBookings: [
      { id: 'LI-59102', service: 'Hydrotherapy Circuit', client: 'Alice Wambui', date: 'Today, 11:00 AM', price: 'KES 8,500', status: 'In Progress' },
      { id: 'LI-59088', service: 'Couples Escape', client: 'Mark & Jane Ouma', date: 'Today, 3:00 PM', price: 'KES 16,000', status: 'Confirmed' },
    ],
  },
  {
    id: 'PR-66192',
    dbId: 'prv-66192',
    name: 'James Otieno',
    entityType: 'individual',
    typeId: 'fitness_trainer',
    typeLabel: 'Personal Trainer',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Mombasa',
    region: 'Coast Region',
    flag: '🇰🇪',
    verification: 'pending_review',
    verificationLabel: 'Pending Review',
    contentAttention: 'Updated training certifications awaiting review',
    attentionCount: 1,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Tomorrow • 7:00 AM',
    rating: 4.7,
    reviewCount: 88,
    bookings: 192,
    status: 'under_review',
    statusLabel: 'Under Review',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    email: 'james.fit@coastfitness.ke',
    phone: '+254 711 902 431',
    joinedDate: '04 Jul 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '04 Nov 2026',
    activity: {
      totalBookings: 192,
      upcomingBookings: 8,
      completionRate: '94%',
      cancellationRate: '3.4%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Awaiting Review',
      profileInfo: 'Approved',
      profilePhoto: 'Approved',
    },
    accountHealth: {
      status: 'Under Review',
      openSafetyCases: 0,
      activeRestrictions: 'Pending Certification Audit',
    },
    services: [
      { id: 'srv-fit-1', name: '1-on-1 Strength & Conditioning', duration: '60 min', price: 'KES 3,500', active: true },
      { id: 'srv-fit-2', name: 'High Intensity Athletic Training', duration: '45 min', price: 'KES 3,000', active: true },
      { id: 'srv-fit-3', name: 'Custom Nutrition & Fitness Consultation', duration: '60 min', price: 'KES 4,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-42091', service: 'Strength & Conditioning', client: 'Brian Kiprono', date: 'Today, 8:00 AM', price: 'KES 3,500', status: 'Completed' },
    ],
  },
  {
    id: 'HWR-18291',
    dbId: 'hwr-18291',
    name: 'Savanna Wellness Resort',
    entityType: 'hotel_resort',
    typeId: 'hotel_resort',
    typeLabel: 'Hotel & Wellness Resort',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'documents_review',
    verificationLabel: 'Documents Review',
    contentAttention: 'Commercial resort licence renewal document pending',
    attentionCount: 1,
    availability: 'locations_badge',
    availabilityLabel: '4 Locations',
    locationCount: 4,
    locationBadge: '4 Locations',
    operatingHours: '24/7 Wellness Concierge',
    rating: 4.7,
    reviewCount: 184,
    bookings: 682,
    status: 'pending',
    statusLabel: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=160&auto=format&fit=crop&q=80',
    email: 'resort.admin@savannawellness.com',
    phone: '+254 20 882 1900',
    joinedDate: '14 Aug 2025',
    subscriptionPlan: 'Luxury Resort Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '14 Oct 2026',
    hotelStructure: {
      locations: 4,
      departments: 3,
      services: 32,
      therapists: 28,
    },
    activity: {
      totalBookings: 682,
      upcomingBookings: 31,
      completionRate: '95%',
      cancellationRate: '2.5%',
    },
    verificationChecklist: {
      hospitalityLicence: 'Awaiting Audit',
      spaFacilityCertification: 'Approved',
      poolSafetyAudit: 'Approved',
      fireSafetyCompliance: 'Approved',
    },
    accountHealth: {
      status: 'Pending Document Review',
      openSafetyCases: 0,
      activeRestrictions: 'Limited to Confirmed Guests',
    },
    services: [
      { id: 'srv-res-1', name: 'Holistic Safari Rejuvenation Ritual', duration: '120 min', price: 'KES 14,000', active: true },
      { id: 'srv-res-2', name: 'Thermal Mineral Pool Immersion', duration: '90 min', price: 'KES 6,500', active: true },
      { id: 'srv-res-3', name: 'Private Sunset Yoga Pavilion', duration: '60 min', price: 'KES 5,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-61029', service: 'Safari Rejuvenation', client: 'Elena Rostova', date: 'Tomorrow, 10:00 AM', price: 'KES 14,000', status: 'Confirmed' },
    ],
  },
  {
    id: 'PR-51028',
    dbId: 'prv-51028',
    name: 'Faith Wambui',
    entityType: 'individual',
    typeId: 'yoga_specialist',
    typeLabel: 'Yoga Specialist',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Kisumu',
    region: 'Nyanza Region',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: 'Account suspended following safety incident case #SC-892',
    attentionCount: 1,
    availability: 'unavailable',
    availabilityLabel: 'Unavailable',
    nextAvailable: '—',
    rating: 4.5,
    reviewCount: 42,
    bookings: 124,
    status: 'suspended',
    statusLabel: 'Suspended',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    email: 'faith.wambui@flowyoga.co.ke',
    phone: '+254 733 491 002',
    joinedDate: '29 Sep 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'payment_issue',
    subscriptionRenewal: 'Expired',
    activity: {
      totalBookings: 124,
      upcomingBookings: 0,
      completionRate: '88%',
      cancellationRate: '8.4%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Approved',
      profileInfo: 'Approved',
      profilePhoto: 'Approved',
    },
    accountHealth: {
      status: 'Suspended',
      openSafetyCases: 1,
      activeRestrictions: 'Platform Access Revoked',
    },
    services: [
      { id: 'srv-yoga-1', name: 'Vinyasa Flow Guided Session', duration: '60 min', price: 'KES 3,000', active: false },
      { id: 'srv-yoga-2', name: 'Restorative Yin Yoga', duration: '75 min', price: 'KES 3,800', active: false },
    ],
    recentBookings: [
      { id: 'LI-39102', service: 'Vinyasa Flow', client: 'Cynthia Achieng', date: '22 Aug 2026', price: 'KES 3,000', status: 'Cancelled' },
    ],
  },
  {
    id: 'PR-78211',
    dbId: 'prv-78211',
    name: 'ZenFlow Meditation',
    entityType: 'individual',
    typeId: 'meditation_specialist',
    typeLabel: 'Meditation Specialist',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nakuru',
    region: 'Rift Valley Region',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 5:00 PM',
    rating: 4.8,
    reviewCount: 94,
    bookings: 310,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    email: 'info@zenflow.co.ke',
    phone: '+254 720 183 944',
    joinedDate: '15 Feb 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '15 Jan 2027',
    activity: {
      totalBookings: 310,
      upcomingBookings: 14,
      completionRate: '97%',
      cancellationRate: '1.8%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Approved',
      profileInfo: 'Approved',
      profilePhoto: 'Approved',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-med-1', name: 'Mindfulness Breathwork & Sound Healing', duration: '60 min', price: 'KES 3,800', active: true },
      { id: 'srv-med-2', name: 'Executive Stress Reduction Program', duration: '90 min', price: 'KES 6,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-51829', service: 'Breathwork & Sound', client: 'George Kariuki', date: 'Today, 10:00 AM', price: 'KES 3,800', status: 'Completed' },
    ],
  },
  {
    id: 'PR-44902',
    dbId: 'prv-44902',
    name: 'Revive Physiotherapy',
    entityType: 'individual',
    typeId: 'physiotherapy',
    typeLabel: 'Physiotherapy & Recovery',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Tomorrow • 9:30 AM',
    rating: 4.6,
    reviewCount: 162,
    bookings: 520,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&auto=format&fit=crop&q=80',
    email: 'dr.kimani@revivephysio.ke',
    phone: '+254 724 991 382',
    joinedDate: '10 Nov 2024',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '10 Nov 2026',
    activity: {
      totalBookings: 520,
      upcomingBookings: 22,
      completionRate: '95%',
      cancellationRate: '2.8%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Approved',
      medicalBoardLicence: 'Approved',
      profilePhoto: 'Approved',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-phy-1', name: 'Orthopedic Musculoskeletal Rehabilitation', duration: '60 min', price: 'KES 5,500', active: true },
      { id: 'srv-phy-2', name: 'Sports Injury Dry Needling & Recovery', duration: '45 min', price: 'KES 4,800', active: true },
      { id: 'srv-phy-3', name: 'Post-Surgical Mobility Restoration', duration: '60 min', price: 'KES 6,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-53901', service: 'Orthopedic Rehab', client: 'Patrick Maina', date: 'Today, 1:30 PM', price: 'KES 5,500', status: 'Completed' },
    ],
  },
  {
    id: 'PR-90321',
    dbId: 'prv-90321',
    name: 'Elite Fitness Hub',
    entityType: 'individual',
    typeId: 'fitness_trainer',
    typeLabel: 'Personal Trainer',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'content_review',
    verificationLabel: 'Content Review',
    contentAttention: '2 profile gallery images awaiting admin moderation',
    attentionCount: 2,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 6:00 PM',
    rating: 4.4,
    reviewCount: 38,
    bookings: 76,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=160&auto=format&fit=crop&q=80',
    email: 'admin@elitehub.co.ke',
    phone: '+254 715 391 800',
    joinedDate: '19 Aug 2026',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '19 Sep 2026',
    activity: {
      totalBookings: 76,
      upcomingBookings: 6,
      completionRate: '93%',
      cancellationRate: '4.1%',
    },
    verificationChecklist: {
      identity: 'Approved',
      credentials: 'Approved',
      profileInfo: 'Approved',
      profilePhoto: 'Awaiting Review',
    },
    accountHealth: {
      status: 'Active (Content Pending)',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-fit2-1', name: 'Metabolic Conditioning Circuit', duration: '45 min', price: 'KES 3,200', active: true },
      { id: 'srv-fit2-2', name: 'Postural Realignment Coaching', duration: '60 min', price: 'KES 4,000', active: true },
    ],
    recentBookings: [
      { id: 'LI-49021', service: 'Metabolic Conditioning', client: 'Dennis Wekesa', date: 'Today, 7:00 AM', price: 'KES 3,200', status: 'Completed' },
    ],
  },
  {
    id: 'SPA-66781',
    dbId: 'spa-66781',
    name: 'Tranquil Touch Spa',
    entityType: 'spa',
    typeId: 'spa',
    typeLabel: 'Spa & Wellness Center',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Mombasa',
    region: 'Coast Region',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'open_now',
    availabilityLabel: 'Open Now',
    locationCount: 2,
    locationBadge: '2 Branches',
    operatingHours: 'Mon - Sun • 9:00 AM - 8:30 PM',
    rating: 4.9,
    reviewCount: 298,
    bookings: 924,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=160&auto=format&fit=crop&q=80',
    email: 'mombasa@tranquiltouch.co.ke',
    phone: '+254 41 228 1090',
    joinedDate: '08 Mar 2025',
    subscriptionPlan: 'Enterprise Spa Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '08 Mar 2027',
    businessStructure: {
      branches: 2,
      staff: 14,
      services: 18,
      resources: 8,
    },
    activity: {
      totalBookings: 924,
      upcomingBookings: 32,
      completionRate: '98%',
      cancellationRate: '1.0%',
    },
    verificationChecklist: {
      businessRegistration: 'Approved',
      commercialLease: 'Approved',
      healthSanitation: 'Approved',
      staffCertifications: 'Approved',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-tts-1', name: 'Coastal Coconut Scrub & Body Wrap', duration: '90 min', price: 'KES 7,500', active: true },
      { id: 'srv-tts-2', name: 'Deep Balinese Acupressure Massage', duration: '60 min', price: 'KES 6,200', active: true },
    ],
    recentBookings: [
      { id: 'LI-56012', service: 'Coconut Scrub', client: 'Salma Omar', date: 'Today, 2:00 PM', price: 'KES 7,500', status: 'Confirmed' },
    ],
  },
  {
    id: 'HWR-33012',
    dbId: 'hwr-33012',
    name: 'Kilimani Heights Hotel',
    entityType: 'hotel_resort',
    typeId: 'hotel_resort',
    typeLabel: 'Hotel & Wellness Resort',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'locations_badge',
    availabilityLabel: '2 Locations',
    locationCount: 2,
    locationBadge: '2 Locations',
    operatingHours: '24/7 Wellness Concierge',
    rating: 4.8,
    reviewCount: 220,
    bookings: 1120,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=160&auto=format&fit=crop&q=80',
    email: 'wellness@kilimaniheights.com',
    phone: '+254 20 710 4400',
    joinedDate: '12 Dec 2024',
    subscriptionPlan: 'Luxury Resort Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '12 Dec 2026',
    hotelStructure: {
      locations: 2,
      departments: 2,
      services: 22,
      therapists: 16,
    },
    activity: {
      totalBookings: 1120,
      upcomingBookings: 38,
      completionRate: '97%',
      cancellationRate: '1.9%',
    },
    verificationChecklist: {
      hospitalityLicence: 'Approved',
      spaFacilityCertification: 'Approved',
      poolSafetyAudit: 'Approved',
      fireSafetyCompliance: 'Approved',
    },
    accountHealth: {
      status: 'Active',
      openSafetyCases: 0,
      activeRestrictions: 'None',
    },
    services: [
      { id: 'srv-kh-1', name: 'Rooftop Infinity Heated Pool Spa Treatment', duration: '90 min', price: 'KES 9,000', active: true },
      { id: 'srv-kh-2', name: 'Executive Recharging Steam & Sauna Session', duration: '60 min', price: 'KES 4,500', active: true },
    ],
    recentBookings: [
      { id: 'LI-58291', service: 'Rooftop Spa Treatment', client: 'Arthur Mutua', date: 'Today, 4:00 PM', price: 'KES 9,000', status: 'Confirmed' },
    ],
  },
  // Multi-Market Providers for South Africa, Nigeria, Ghana, Uganda, Tanzania
  {
    id: 'PR-19284',
    dbId: 'prv-19284',
    name: 'Lerato Khumalo',
    entityType: 'individual',
    typeId: 'massage_therapist',
    typeLabel: 'Massage Therapist',
    market: 'South Africa',
    marketCode: 'ZA',
    city: 'Johannesburg',
    region: 'Gauteng',
    flag: '🇿🇦',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 2:00 PM',
    rating: 4.9,
    reviewCount: 96,
    bookings: 210,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&auto=format&fit=crop&q=80',
    email: 'lerato@jhbwellness.co.za',
    phone: '+27 11 829 1029',
    joinedDate: '10 Feb 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '10 Feb 2027',
    activity: { totalBookings: 210, upcomingBookings: 9, completionRate: '98%', cancellationRate: '1.1%' },
    verificationChecklist: { identity: 'Approved', credentials: 'Approved', profileInfo: 'Approved', profilePhoto: 'Approved' },
    accountHealth: { status: 'Active', openSafetyCases: 0, activeRestrictions: 'None' },
    services: [{ id: 'srv-za-1', name: 'African Calabash Deep Massage', duration: '75 min', price: 'ZAR 850', active: true }],
    recentBookings: [{ id: 'LI-71029', service: 'Calabash Deep Massage', client: 'Sipho Ndlovu', date: 'Today, 1:00 PM', price: 'ZAR 850', status: 'Confirmed' }],
  },
  {
    id: 'SPA-41029',
    dbId: 'spa-41029',
    name: 'Oasis Urban Sanctuary',
    entityType: 'spa',
    typeId: 'spa',
    typeLabel: 'Spa & Wellness Center',
    market: 'South Africa',
    marketCode: 'ZA',
    city: 'Cape Town',
    region: 'Western Cape',
    flag: '🇿🇦',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'open_now',
    availabilityLabel: 'Open Now',
    locationCount: 4,
    locationBadge: '4 Branches',
    rating: 4.9,
    reviewCount: 410,
    bookings: 1820,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=160&auto=format&fit=crop&q=80',
    email: 'capetown@oasisurban.co.za',
    phone: '+27 21 440 9200',
    joinedDate: '01 Nov 2024',
    subscriptionPlan: 'Enterprise Spa Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '01 Nov 2026',
    businessStructure: { branches: 4, staff: 22, services: 30, resources: 16 },
    activity: { totalBookings: 1820, upcomingBookings: 52, completionRate: '99%', cancellationRate: '0.8%' },
    verificationChecklist: { businessRegistration: 'Approved', commercialLease: 'Approved', healthSanitation: 'Approved', staffCertifications: 'Approved' },
    accountHealth: { status: 'Active', openSafetyCases: 0, activeRestrictions: 'None' },
    services: [{ id: 'srv-za-spa-1', name: 'Cape Fynbos Hydrating Wrap', duration: '90 min', price: 'ZAR 1,200', active: true }],
    recentBookings: [{ id: 'LI-72019', service: 'Fynbos Hydrating Wrap', client: 'Chloe van der Merwe', date: 'Today, 3:30 PM', price: 'ZAR 1,200', status: 'Confirmed' }],
  },
  {
    id: 'PR-58291',
    dbId: 'prv-58291',
    name: 'Chidi Eze',
    entityType: 'individual',
    typeId: 'fitness_trainer',
    typeLabel: 'Personal Trainer',
    market: 'Nigeria',
    marketCode: 'NG',
    city: 'Lagos',
    region: 'Lagos State',
    flag: '🇳🇬',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 4:00 PM',
    rating: 4.8,
    reviewCount: 110,
    bookings: 240,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    email: 'chidi@lagosfit.ng',
    phone: '+234 803 918 2011',
    joinedDate: '15 Jan 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '15 Jan 2027',
    activity: { totalBookings: 240, upcomingBookings: 11, completionRate: '96%', cancellationRate: '2.0%' },
    verificationChecklist: { identity: 'Approved', credentials: 'Approved', profileInfo: 'Approved', profilePhoto: 'Approved' },
    accountHealth: { status: 'Active', openSafetyCases: 0, activeRestrictions: 'None' },
    services: [{ id: 'srv-ng-1', name: 'High-Impact Power Boxing & Conditioning', duration: '60 min', price: 'NGN 25,000', active: true }],
    recentBookings: [{ id: 'LI-81029', service: 'Power Boxing', client: 'Emeka Okafor', date: 'Today, 2:00 PM', price: 'NGN 25,000', status: 'Confirmed' }],
  },
  {
    id: 'PR-38102',
    dbId: 'prv-38102',
    name: 'Kofi Mensah',
    entityType: 'individual',
    typeId: 'massage_therapist',
    typeLabel: 'Massage Therapist',
    market: 'Ghana',
    marketCode: 'GH',
    city: 'Accra',
    region: 'Greater Accra',
    flag: '🇬🇭',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Today • 3:00 PM',
    rating: 4.9,
    reviewCount: 78,
    bookings: 180,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    email: 'kofi@accrawellness.gh',
    phone: '+233 24 918 2039',
    joinedDate: '22 Mar 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '22 Mar 2027',
    activity: { totalBookings: 180, upcomingBookings: 7, completionRate: '97%', cancellationRate: '1.5%' },
    verificationChecklist: { identity: 'Approved', credentials: 'Approved', profileInfo: 'Approved', profilePhoto: 'Approved' },
    accountHealth: { status: 'Active', openSafetyCases: 0, activeRestrictions: 'None' },
    services: [{ id: 'srv-gh-1', name: 'Shea Butter Aromatherapy Massage', duration: '60 min', price: 'GHS 450', active: true }],
    recentBookings: [{ id: 'LI-91021', service: 'Shea Butter Aromatherapy', client: 'Kwame Asante', date: 'Today, 11:30 AM', price: 'GHS 450', status: 'Completed' }],
  },
  {
    id: 'PR-33412',
    dbId: 'prv-33412',
    name: 'Dr. Faraji Msuya',
    entityType: 'individual',
    typeId: 'physiotherapy',
    typeLabel: 'Physiotherapy & Recovery',
    market: 'Tanzania',
    marketCode: 'TZ',
    city: 'Dar es Salaam',
    region: 'Dar es Salaam',
    flag: '🇹🇿',
    verification: 'verified',
    verificationLabel: 'Verified',
    contentAttention: null,
    attentionCount: 0,
    availability: 'available_now',
    availabilityLabel: 'Available Now',
    nextAvailable: 'Tomorrow • 10:00 AM',
    rating: 4.7,
    reviewCount: 65,
    bookings: 145,
    status: 'active',
    statusLabel: 'Active',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=160&auto=format&fit=crop&q=80',
    email: 'faraji@darphysio.tz',
    phone: '+255 754 819 021',
    joinedDate: '02 Jun 2025',
    subscriptionPlan: 'Professional Plan',
    subscriptionStatus: 'active',
    subscriptionRenewal: '02 Jun 2027',
    activity: { totalBookings: 145, upcomingBookings: 6, completionRate: '96%', cancellationRate: '2.1%' },
    verificationChecklist: { identity: 'Approved', credentials: 'Approved', medicalBoardLicence: 'Approved', profilePhoto: 'Approved' },
    accountHealth: { status: 'Active', openSafetyCases: 0, activeRestrictions: 'None' },
    services: [{ id: 'srv-tz-1', name: 'Targeted Spinal Decompression Therapy', duration: '60 min', price: 'TZS 120,000', active: true }],
    recentBookings: [{ id: 'LI-95012', service: 'Spinal Decompression', client: 'Juma Hassan', date: 'Yesterday, 3:00 PM', price: 'TZS 120,000', status: 'Completed' }],
  },
]

// Query and Filter Engine for ADM-021 Directory
export function queryProviderDirectory({
  market = 'ALL',
  providerType = 'all',
  subcategory = 'all',
  status = 'all',
  searchQuery = '',
  verification = 'all',
  location = 'all',
  availability = 'all',
  subscription = 'all',
  minRating = 0,
  sortBy = 'newest',
  page = 1,
  pageSize = 10,
} = {}) {
  let list = [...DIRECTORY_PROVIDERS]

  // Market filter
  if (market && market !== 'ALL') {
    list = list.filter((p) => p.marketCode.toUpperCase() === market.toUpperCase())
  }

  // Provider Type Filter (all, professionals, spa, hotel_resort)
  if (providerType && providerType !== 'all') {
    if (providerType === 'professionals') {
      list = list.filter((p) => p.entityType === 'individual')
    } else if (providerType === 'spa') {
      list = list.filter((p) => p.entityType === 'spa' || p.typeId === 'spa')
    } else if (providerType === 'hotel_resort') {
      list = list.filter((p) => p.entityType === 'hotel_resort' || p.typeId === 'hotel_resort')
    } else {
      list = list.filter((p) => p.typeId === providerType)
    }
  }

  // Professional subcategory filter
  if (subcategory && subcategory !== 'all') {
    list = list.filter((p) => p.typeId === subcategory)
  }

  // Status Filter (all, active, pending, under_review, suspended, inactive)
  if (status && status !== 'all') {
    list = list.filter((p) => p.status.toLowerCase() === status.toLowerCase())
  }

  // Search Filter (ID priority, name, business, email, phone)
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim().toLowerCase()
    list = list.filter((p) => {
      const matchId = p.id.toLowerCase().includes(q)
      const matchName = p.name.toLowerCase().includes(q)
      const matchEmail = (p.email || '').toLowerCase().includes(q)
      const matchPhone = (p.phone || '').toLowerCase().includes(q)
      const matchCity = (p.city || '').toLowerCase().includes(q)
      const matchType = (p.typeLabel || '').toLowerCase().includes(q)
      return matchId || matchName || matchEmail || matchPhone || matchCity || matchType
    })

    // Exact ID matches rank first
    list.sort((a, b) => {
      const aExact = a.id.toLowerCase() === q ? 1 : 0
      const bExact = b.id.toLowerCase() === q ? 1 : 0
      return bExact - aExact
    })
  }

  // Dropdown verification filter
  if (verification && verification !== 'all') {
    list = list.filter((p) => p.verification.toLowerCase() === verification.toLowerCase())
  }

  // Dropdown location filter
  if (location && location !== 'all') {
    list = list.filter((p) => p.city.toLowerCase() === location.toLowerCase() || p.region?.toLowerCase() === location.toLowerCase())
  }

  // Dropdown availability filter
  if (availability && availability !== 'all') {
    list = list.filter((p) => p.availability.toLowerCase() === availability.toLowerCase())
  }

  // Dropdown subscription filter
  if (subscription && subscription !== 'all') {
    list = list.filter((p) => p.subscriptionStatus.toLowerCase() === subscription.toLowerCase())
  }

  // Min rating filter
  if (minRating > 0) {
    list = list.filter((p) => p.rating >= minRating)
  }

  // Sort
  if (sortBy === 'newest') {
    // Keep order
  } else if (sortBy === 'oldest') {
    list.reverse()
  } else if (sortBy === 'rating_desc') {
    list.sort((a, b) => b.rating - a.rating)
  } else if (sortBy === 'bookings_desc') {
    list.sort((a, b) => b.bookings - a.bookings)
  } else if (sortBy === 'attention') {
    list.sort((a, b) => (b.attentionCount || 0) - (a.attentionCount || 0))
  } else if (sortBy === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Market scaling metrics for top tabs (representing the full platform aggregates)
  const isGlobal = !market || market === 'ALL'
  const isKenya = market === 'KE'
  const baseTotal = isGlobal ? 24860 : isKenya ? 12420 : Math.round(24860 * 0.1)
  const baseProfessionals = isGlobal ? 20260 : isKenya ? 10130 : Math.round(20260 * 0.1)
  const baseSpas = isGlobal ? 3820 : isKenya ? 1910 : Math.round(3820 * 0.1)
  const baseHotels = isGlobal ? 780 : isKenya ? 380 : Math.round(780 * 0.1)

  const statusCounts = {
    all: baseTotal,
    active: isGlobal ? 21420 : Math.round(baseTotal * 0.86),
    pending: isGlobal ? 428 : Math.max(12, Math.round(baseTotal * 0.017)),
    under_review: isGlobal ? 310 : Math.max(8, Math.round(baseTotal * 0.012)),
    suspended: isGlobal ? 64 : Math.max(2, Math.round(baseTotal * 0.003)),
    inactive: isGlobal ? 2638 : Math.round(baseTotal * 0.108),
  }

  const typeCounts = {
    all: baseTotal,
    professionals: baseProfessionals,
    spa: baseSpas,
    hotel_resort: baseHotels,
  }

  // Pagination
  const totalItems = list.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = list.slice(startIndex, endIndex)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    typeCounts,
    statusCounts,
    displayTotalCount: baseTotal,
  }
}

