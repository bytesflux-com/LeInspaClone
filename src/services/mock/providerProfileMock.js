// Master Mock Dataset & Query Engine for ADM-022: Provider Admin Profile
// Provides authentic, high-fidelity source-of-truth data for:
// 1. Individual Professional (Grace Njeri - PR-82941)
// 2. Business Provider: Spa & Wellness Center (Serenity Wellness Spa - SPA-28192)
// 3. Business Provider: Hotel & Wellness Resort (Savanna Wellness Resort - HWR-18291)
// Plus fallback resolution for any provider in DIRECTORY_PROVIDERS.

import { DIRECTORY_PROVIDERS } from './providerDirectoryMock'

export const PROVIDER_PROFILES = {
  // 1. INDIVIDUAL PROFESSIONAL: Grace Njeri (PR-82941)
  'PR-82941': {
    id: 'PR-82941',
    dbId: 'prv-82941',
    name: 'Grace Njeri',
    verified: true,
    entityType: 'individual',
    providerType: 'Massage Therapist',
    typeId: 'massage_therapist',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    status: 'active',
    statusLabel: 'Active',
    availabilityStatus: 'available_now',
    availabilityLabel: 'Available Now',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
    joinedDate: '12 Jan 2026',
    lastActive: 'Today • 11:42 AM',
    rating: 4.9,
    reviewCount: 126,
    tagline: 'Wellness is a journey, not a luxury.',

    // Provider Health Cards (6 clean cards)
    health: {
      verification: 'Verified',
      account: 'Active',
      subscription: 'Active',
      bookings: 284,
      upcomingBookings: 12,
      rating: 4.9,
      reviews: 126,
      openIssues: 0,
      openIssuesSubtitle: 'No active cases',
    },

    // Personal Information
    personalInfo: {
      fullName: 'Grace Njeri',
      providerId: 'PR-82941',
      providerType: 'Massage Therapist',
      email: 'grace.njeri@example.com',
      phone: '+254 712 345 678',
      country: 'Kenya',
      city: 'Nairobi',
      accountCreated: '12 Jan 2026',
      dateOfBirth: '14 May 1993',
      gender: 'Female',
      emergencyContact: '+254 722 999 111 (Sister)',
      address: 'Kilimani, Argwings Kodhek Rd, Nairobi',
    },

    // Professional Profile
    professionalInfo: {
      specialization: 'Massage Therapy',
      experience: '6 Years',
      serviceModes: ['Home Service', 'Provider Location'],
      languages: 'English • Swahili',
      bio: 'Certified massage therapist with 6+ years of experience. I specialize in deep tissue, Swedish and sports massage, helping clients achieve relaxation, pain relief and overall wellness.',
      education: 'Kenya Institute of Holistic Therapies, Diploma in Clinical Massage (2020)',
      certifications: [
        'ITEC Level 3 Diploma in Holistic Massage',
        'Certified Trigger Point & Myofascial Specialist',
        'Red Cross First Aid & CPR Certified',
      ],
      equipmentSupplied: ['Professional Hydraulic Massage Table', 'Organic Aromatherapy Oils', 'Hot Stone Kit', 'Sanitized Linens'],
    },

    // Availability Engine
    availability: {
      status: 'available_now',
      statusLabel: 'Available Now',
      nextAvailable: 'Today • 3:30 PM',
      thisWeekSlots: '18 available slots',
      serviceArea: 'Nairobi • 15 km travel radius',
      radiusKm: 15,
      coordinates: { lat: -1.2921, lng: 36.8219 },
      travelBase: 'Kilimani / Nairobi Central',
      workingHours: 'Mon - Sat: 8:00 AM – 7:00 PM',
      slotsToday: ['11:00 AM (Booked)', '3:30 PM (Available)', '5:30 PM (Available)', '7:00 PM (Available)'],
    },

    // Photos & Gallery
    gallery: {
      mainPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
      thumbnails: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&auto=format&fit=crop&q=80',
      ],
      totalCount: 15,
      pendingApproval: {
        hasPending: true,
        itemType: 'Profile Photo',
        title: 'Profile photo submitted',
        submittedAt: '10 Sep 2026, 02:18 PM',
        previewUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
      },
    },

    // Verification & Compliance
    verification: {
      status: 'approved',
      identity: { status: 'Approved', verifiedAt: '14 Jan 2026', method: 'National ID OCR + Biometric Liveness' },
      credentials: { status: 'Approved', verifiedAt: '15 Jan 2026', certName: 'ITEC Level 3 Holistic Massage' },
      profileInfo: { status: 'Approved', verifiedAt: '15 Jan 2026' },
      profilePhoto: { status: 'Awaiting Review', submittedAt: '10 Sep 2026', note: 'New profile photo submitted for seasonal refresh' },
      supportingDocuments: { status: 'Approved', count: 3, details: 'Tax Compliance, Police Clearance, First Aid' },
      rejectionAlert: null,
    },

    // Content Approval Section
    contentApproval: {
      profilePhoto: 'Pending',
      gallery: 'Approved',
      bio: 'Approved',
      services: 'Approved',
      pendingCount: 1,
      items: [
        {
          id: 'cnt-photo-829',
          type: 'Profile Photo',
          status: 'pending',
          submittedAt: '10 Sep 2026 • 2:18 PM',
          url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },

    // Active Services
    services: [
      {
        id: 'srv-1',
        name: 'Deep Tissue Massage',
        duration: '60 min',
        price: 'KES 4,500',
        priceNum: 4500,
        status: 'Active',
        category: 'Massage Therapy',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=160&auto=format&fit=crop&q=80',
        description: 'Targets chronic muscle tension with focused, deep pressure technique.',
      },
      {
        id: 'srv-2',
        name: 'Swedish Massage',
        duration: '60 min',
        price: 'KES 3,500',
        priceNum: 3500,
        status: 'Active',
        category: 'Relaxation',
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=160&auto=format&fit=crop&q=80',
        description: 'Classic flowing Swedish strokes designed for deep calm and circulation boost.',
      },
      {
        id: 'srv-3',
        name: 'Sports Massage',
        duration: '90 min',
        price: 'KES 6,000',
        priceNum: 6000,
        status: 'Active',
        category: 'Recovery',
        image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=160&auto=format&fit=crop&q=80',
        description: 'Pre and post athletic performance recovery therapy with assisted stretching.',
      },
      {
        id: 'srv-4',
        name: 'Hot Stone Therapy',
        duration: '75 min',
        price: 'KES 7,200',
        priceNum: 7200,
        status: 'Active',
        category: 'Specialty',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=160&auto=format&fit=crop&q=80',
        description: 'Volcanic basalt stones melt muscle tightness and balance internal energy.',
      },
    ],

    // Booking Performance
    bookingPerformance: {
      total: 284,
      upcoming: 12,
      completed: 268,
      cancelled: 4,
      completionRate: '96%',
      cancellationRate: '2.1%',
      recentBookings: [
        { id: 'LI-48291', client: 'Sarah Kamau', service: 'Deep Tissue Massage', date: 'Today, 2:00 PM', price: 'KES 4,500', status: 'Confirmed' },
        { id: 'LI-48190', client: 'David Njoroge', service: 'Swedish Relaxation', date: 'Yesterday, 4:30 PM', price: 'KES 6,000', status: 'Completed' },
        { id: 'LI-48011', client: 'Wanjiru Muthoni', service: 'Hot Stone Therapy', date: '08 Oct 2026', price: 'KES 7,200', status: 'Completed' },
        { id: 'LI-47952', client: 'Kevin Omondi', service: 'Sports Massage', date: '06 Oct 2026', price: 'KES 6,000', status: 'Completed' },
        { id: 'LI-47810', client: 'Amina Hassan', service: 'Deep Tissue Massage', date: '03 Oct 2026', price: 'KES 4,500', status: 'Cancelled' },
      ],
    },

    // Financial Position (Permission-controlled)
    earnings: {
      currency: 'KES',
      totalEarnings: 1428500,
      totalEarningsFormatted: 'KES 1,428,500',
      thisMonth: 184200,
      thisMonthFormatted: 'KES 184,200',
      pending: 24500,
      pendingFormatted: 'KES 24,500',
      availableForWithdrawal: 159700,
      availableFormatted: 'KES 159,700',
      defaultMasked: true, // Sensitive financial information is permission controlled
      bankDetails: {
        bankName: 'Equity Bank Kenya',
        accountName: 'Grace Njeri Mwangi',
        accountNumberMasked: '•••• •••• ••84 1920',
        payoutMethod: 'Direct M-PESA & Bank Transfer',
      },
    },

    // Subscription
    subscription: {
      status: 'Active',
      plan: 'Professional Plan',
      currentPeriod: '12 Sep – 12 Oct 2026',
      nextRenewal: '12 Oct 2026',
      paymentStatus: 'Paid',
      interval: 'Monthly',
      features: ['Unlimited Booking Requests', 'Featured in Search Radius', 'Zero Lé Inspa Processing Commission On First 20 Bookings', 'Priority Support'],
    },

    // Reviews & Rating Breakdown
    reviews: {
      rating: 4.9,
      reviewCount: 126,
      distribution: [
        { stars: 5, percentage: 92, count: 116 },
        { stars: 4, percentage: 6, count: 8 },
        { stars: 3, percentage: 2, count: 2 },
        { stars: 2, percentage: 0, count: 0 },
        { stars: 1, percentage: 0, count: 0 },
      ],
      recentReview: {
        clientName: 'James K.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: '2 days ago',
        comment: 'Amazing experience! Very professional and skilled. Highly recommend.',
        serviceName: 'Deep Tissue Massage (60 min)',
      },
      list: [
        {
          id: 'rev-1',
          clientName: 'James K.',
          rating: 5,
          date: '08 Oct 2026',
          comment: 'Amazing experience! Very professional and skilled. Highly recommend.',
          service: 'Deep Tissue Massage',
        },
        {
          id: 'rev-2',
          clientName: 'Beatrice Wangari',
          rating: 5,
          date: '02 Oct 2026',
          comment: 'Grace arrived promptly with pristine equipment. Relieved my shoulder pain completely!',
          service: 'Sports Massage',
        },
        {
          id: 'rev-3',
          clientName: 'Dennis Mutua',
          rating: 4.5,
          date: '27 Sep 2026',
          comment: 'Great touch, very respectful and knowledgeable about physiology.',
          service: 'Swedish Massage',
        },
      ],
    },

    // Support & Safety
    supportSafety: {
      openSupportCases: 0,
      openDisputes: 0,
      safetyReports: 0,
      activeRestrictions: 'None',
      statusText: 'No open safety concerns',
      isClean: true,
      history: [
        { id: 'cs-1092', date: '14 May 2026', type: 'Client Inquiry', subject: 'Address clarification for home visit', status: 'Resolved' },
      ],
    },

    // Recent Activity Feed
    recentActivity: [
      { id: 'act-1', time: 'Today • 11:42 AM', action: 'Provider logged in', type: 'session' },
      { id: 'act-2', time: 'Today • 10:15 AM', action: 'Availability updated', type: 'schedule' },
      { id: 'act-3', time: 'Yesterday • 4:30 PM', action: 'Booking #LI-48291 confirmed', type: 'booking' },
      { id: 'act-4', time: '10 Sep • 2:18 PM', action: 'Profile photo submitted for review', type: 'content' },
      { id: 'act-5', time: '08 Sep • 9:00 AM', action: 'Payout of KES 78,500 disbursed', type: 'finance' },
    ],

    // Internal Admin Notes (Never public)
    internalNotes: [
      {
        id: 'note-1',
        text: 'Professional credential confirmed during verification. Provider maintains high ratings and low cancellation rate.',
        author: 'Jane',
        team: 'Verification Team',
        date: '10 Sep 2026',
        createdAt: '2026-09-10T14:30:00Z',
      },
    ],
  },

  // 2. DYNAMIC BUSINESS PROVIDER: Serenity Wellness Spa (SPA-28192)
  'SPA-28192': {
    id: 'SPA-28192',
    dbId: 'spa-28192',
    name: 'Serenity Wellness Spa',
    verified: true,
    entityType: 'spa',
    providerType: 'Spa & Wellness Center',
    typeId: 'spa',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    status: 'active',
    statusLabel: 'Active',
    availabilityStatus: 'open_now',
    availabilityLabel: 'Open Now (3 Branches)',
    avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&auto=format&fit=crop&q=80',
    joinedDate: '18 Jan 2025',
    lastActive: 'Today • 12:05 PM',
    rating: 4.8,
    reviewCount: 342,
    tagline: 'An urban sanctuary of restoration and holistic botanical wellness.',

    // Provider Health Cards
    health: {
      verification: 'Verified',
      account: 'Active',
      subscription: 'Active',
      bookings: 1420,
      upcomingBookings: 46,
      rating: 4.8,
      reviews: 342,
      openIssues: 0,
      openIssuesSubtitle: 'No active cases',
    },

    // Business Information (instead of Personal Information)
    businessInfo: {
      businessName: 'Serenity Wellness Spa Ltd',
      providerId: 'SPA-28192',
      providerType: 'Spa & Wellness Center',
      email: 'contact@serenityspa.co.ke',
      phone: '+254 20 491 8200',
      country: 'Kenya',
      city: 'Nairobi',
      accountCreated: '18 Jan 2025',
      taxPin: 'P051928190Z',
      businessRegNo: 'CPR/2023/892019',
      hqAddress: '42 Peponi Road, Westlands, Nairobi',
      managingDirector: 'Angela Nduta',
    },

    // Dynamic Business Structure
    businessStructure: {
      branches: 3,
      staff: 18,
      services: 24,
      resources: 12,
      branchList: [
        { name: 'Nairobi Flagship Hub', location: 'Peponi Rd, Westlands', rooms: 6, staff: 9, status: 'Active' },
        { name: 'Karen Sanctuary', location: 'Marula Lane, Karen', rooms: 4, staff: 6, status: 'Active' },
        { name: 'Gigiri Diplomatic Suite', location: 'UN Avenue, Gigiri', rooms: 2, staff: 3, status: 'Active' },
      ],
      staffOverview: [
        { name: 'Grace M.', role: 'Head Esthetician', certified: true },
        { name: 'Robert K.', role: 'Senior Hydrotherapist', certified: true },
        { name: 'Alice O.', role: 'Ayurvedic Specialist', certified: true },
      ],
      resourcesOverview: [
        { type: 'Hydrotherapy Suites', count: 2 },
        { type: 'Couples Massage Rooms', count: 4 },
        { type: 'Botanical Facial Cabins', count: 4 },
        { type: 'Infrared Saunas', count: 2 },
      ],
    },

    // Availability
    availability: {
      status: 'open_now',
      statusLabel: 'Open Now',
      nextAvailable: 'Today • 2:00 PM',
      thisWeekSlots: '142 available slots',
      serviceArea: '3 Central Nairobi Branches',
      radiusKm: 25,
      coordinates: { lat: -1.2618, lng: 36.8042 },
      travelBase: 'Peponi Road, Westlands',
      workingHours: 'Mon - Sun: 8:00 AM – 9:00 PM',
    },

    gallery: {
      mainPhoto: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
      thumbnails: [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&auto=format&fit=crop&q=80',
      ],
      totalCount: 28,
      pendingApproval: { hasPending: false },
    },

    verification: {
      status: 'approved',
      businessRegistration: { status: 'Approved', verifiedAt: '20 Jan 2025' },
      commercialLease: { status: 'Approved', verifiedAt: '20 Jan 2025' },
      healthSanitation: { status: 'Approved', verifiedAt: '22 Jan 2025' },
      staffCertifications: { status: 'Approved', verifiedAt: '22 Jan 2025' },
      profileInfo: { status: 'Approved', verifiedAt: '20 Jan 2025' },
      profilePhoto: { status: 'Approved', verifiedAt: '20 Jan 2025' },
      supportingDocuments: { status: 'Approved', count: 6 },
    },

    contentApproval: {
      profilePhoto: 'Approved',
      gallery: 'Approved',
      bio: 'Approved',
      services: 'Approved',
      pendingCount: 0,
      items: [],
    },

    services: [
      { id: 'srv-spa-1', name: 'Signature Hydrotherapy Circuit', duration: '90 min', price: 'KES 8,500', priceNum: 8500, status: 'Active', category: 'Hydrotherapy' },
      { id: 'srv-spa-2', name: 'Couples Luxury Escape Massage', duration: '120 min', price: 'KES 16,000', priceNum: 16000, status: 'Active', category: 'Packages' },
      { id: 'srv-spa-3', name: 'Purifying Botanical Facial', duration: '60 min', price: 'KES 5,500', priceNum: 5500, status: 'Active', category: 'Facials' },
      { id: 'srv-spa-4', name: 'Bamboo Deep Tension Release', duration: '75 min', price: 'KES 7,000', priceNum: 7000, status: 'Active', category: 'Massage' },
    ],

    bookingPerformance: {
      total: 1420,
      upcoming: 46,
      completed: 1358,
      cancelled: 16,
      completionRate: '98%',
      cancellationRate: '1.2%',
    },

    earnings: {
      currency: 'KES',
      totalEarnings: 8940000,
      totalEarningsFormatted: 'KES 8,940,000',
      thisMonth: 1240000,
      thisMonthFormatted: 'KES 1,240,000',
      pending: 180000,
      pendingFormatted: 'KES 180,000',
      availableForWithdrawal: 1060000,
      availableFormatted: 'KES 1,060,000',
      defaultMasked: true,
    },

    subscription: {
      status: 'Active',
      plan: 'Enterprise Spa Plan',
      currentPeriod: '24 Oct – 24 Nov 2026',
      nextRenewal: '24 Nov 2026',
      paymentStatus: 'Paid',
      interval: 'Monthly',
      features: ['Up to 5 Branches', 'Unlimited Staff Accounts', 'Lé Inspa Multi-Room Dispatch', 'Dedicated Account Manager'],
    },

    reviews: {
      rating: 4.8,
      reviewCount: 342,
      distribution: [
        { stars: 5, percentage: 88, count: 301 },
        { stars: 4, percentage: 9, count: 31 },
        { stars: 3, percentage: 3, count: 10 },
        { stars: 2, percentage: 0, count: 0 },
        { stars: 1, percentage: 0, count: 0 },
      ],
      recentReview: {
        clientName: 'Alice Wambui',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: '3 days ago',
        comment: 'The Westlands Hydrotherapy suite was spotless and transcendent. Exceptional therapists.',
        serviceName: 'Signature Hydrotherapy Circuit (90 min)',
      },
    },

    supportSafety: {
      openSupportCases: 0,
      openDisputes: 0,
      safetyReports: 0,
      activeRestrictions: 'None',
      statusText: 'No open safety concerns',
      isClean: true,
    },

    recentActivity: [
      { id: 'act-1', time: 'Today • 12:05 PM', action: 'Branch schedule synchronized', type: 'schedule' },
      { id: 'act-2', time: 'Today • 10:30 AM', action: 'Therapist Robert K. shift started', type: 'staff' },
      { id: 'act-3', time: 'Yesterday • 6:15 PM', action: 'Couples Escape booking #LI-59088 completed', type: 'booking' },
    ],

    internalNotes: [
      {
        id: 'note-spa-1',
        text: 'Facility inspected by Nairobi County Public Health team on 15 Feb 2026. All certificates verified.',
        author: 'Marcus O.',
        team: 'Compliance Team',
        date: '16 Feb 2026',
      },
    ],
  },

  // 3. DYNAMIC BUSINESS PROVIDER: Savanna Wellness Resort (HWR-18291)
  'HWR-18291': {
    id: 'HWR-18291',
    dbId: 'hwr-18291',
    name: 'Savanna Wellness Resort',
    verified: true,
    entityType: 'hotel_resort',
    providerType: 'Hotel & Wellness Resort',
    typeId: 'hotel_resort',
    market: 'Kenya',
    marketCode: 'KE',
    city: 'Nairobi',
    region: 'Nairobi County',
    flag: '🇰🇪',
    status: 'active',
    statusLabel: 'Active',
    availabilityStatus: 'open_now',
    availabilityLabel: '24/7 Wellness Concierge',
    avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80',
    joinedDate: '14 Aug 2025',
    lastActive: 'Today • 09:15 AM',
    rating: 4.7,
    reviewCount: 184,
    tagline: 'Immersive safari luxury intertwined with world-class restorative wellness.',

    // Provider Health Cards
    health: {
      verification: 'Verified',
      account: 'Active',
      subscription: 'Active',
      bookings: 682,
      upcomingBookings: 31,
      rating: 4.7,
      reviews: 184,
      openIssues: 0,
      openIssuesSubtitle: 'No active cases',
    },

    // Business Information
    businessInfo: {
      businessName: 'Savanna Wellness & Safari Resort Ltd',
      providerId: 'HWR-18291',
      providerType: 'Hotel & Wellness Resort',
      email: 'resort.admin@savannawellness.com',
      phone: '+254 20 882 1900',
      country: 'Kenya',
      city: 'Nairobi',
      accountCreated: '14 Aug 2025',
      taxPin: 'P059918230X',
      businessRegNo: 'CPR/2021/489102',
      hqAddress: '15 Langata South Rd, Nairobi',
      managingDirector: 'Christian Moreau',
    },

    // Dynamic Wellness Operations
    wellnessOperations: {
      wellnessLocations: 4,
      wellnessDepartments: 6,
      wellnessStaff: 32,
      activeServices: 18,
      wellnessPackages: 7,
      locationsList: [
        'Garden Spa Pavilion (6 treatment suites)',
        'Thermal Mineral Pool & Hydrotherapy Deck',
        'Sunset Yoga & Meditation Platform',
        'In-Room Wellness Suite Network',
      ],
      departmentsList: [
        'Ayurvedic & Holistic Health',
        'Aromatherapy & Swedish Massage',
        'Hydrotherapy & Thermal Suites',
        'Physiotherapy & Sports Recovery',
        'Aesthetic Facial & Skin Sanctuary',
        '24/7 Wellness Concierge & In-Room Booking',
      ],
      programs: [
        'In-Room Wellness: 24/7 on-demand suite therapies',
        'Concierge Wellness: Bespoke multi-day rejuvenation itineraries',
        'Safari Recovery Ritual: Targeted muscle relief post-game drives',
      ],
    },

    // Availability
    availability: {
      status: 'open_now',
      statusLabel: 'Open 24/7 Concierge',
      nextAvailable: 'Today • 1:00 PM',
      thisWeekSlots: '96 available slots',
      serviceArea: 'Resort Grounds & Guest Pavilions',
      radiusKm: 10,
      coordinates: { lat: -1.3621, lng: 36.7584 },
      travelBase: 'Langata South Road',
      workingHours: '24/7 Resort Operations',
    },

    gallery: {
      mainPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80',
      thumbnails: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80',
      ],
      totalCount: 34,
      pendingApproval: { hasPending: false },
    },

    verification: {
      status: 'approved',
      hospitalityLicence: { status: 'Approved', verifiedAt: '18 Aug 2025' },
      spaFacilityCertification: { status: 'Approved', verifiedAt: '18 Aug 2025' },
      poolSafetyAudit: { status: 'Approved', verifiedAt: '19 Aug 2025' },
      fireSafetyCompliance: { status: 'Approved', verifiedAt: '19 Aug 2025' },
      profileInfo: { status: 'Approved', verifiedAt: '18 Aug 2025' },
      profilePhoto: { status: 'Approved', verifiedAt: '18 Aug 2025' },
      supportingDocuments: { status: 'Approved', count: 8 },
    },

    contentApproval: {
      profilePhoto: 'Approved',
      gallery: 'Approved',
      bio: 'Approved',
      services: 'Approved',
      pendingCount: 0,
      items: [],
    },

    services: [
      { id: 'srv-res-1', name: 'Holistic Safari Rejuvenation Ritual', duration: '120 min', price: 'KES 14,000', priceNum: 14000, status: 'Active', category: 'Signature Rituals' },
      { id: 'srv-res-2', name: 'Thermal Mineral Pool Immersion', duration: '90 min', price: 'KES 6,500', priceNum: 6500, status: 'Active', category: 'Hydrotherapy' },
      { id: 'srv-res-3', name: 'Private Sunset Yoga Pavilion', duration: '60 min', price: 'KES 5,000', priceNum: 5000, status: 'Active', category: 'Mind & Body' },
      { id: 'srv-res-4', name: 'In-Room Aromatherapy Deep Sleep Treatment', duration: '75 min', price: 'KES 9,500', priceNum: 9500, status: 'Active', category: 'In-Room Wellness' },
    ],

    bookingPerformance: {
      total: 682,
      upcoming: 31,
      completed: 641,
      cancelled: 10,
      completionRate: '95%',
      cancellationRate: '2.5%',
    },

    earnings: {
      currency: 'KES',
      totalEarnings: 7420000,
      totalEarningsFormatted: 'KES 7,420,000',
      thisMonth: 980000,
      thisMonthFormatted: 'KES 980,000',
      pending: 120000,
      pendingFormatted: 'KES 120,000',
      availableForWithdrawal: 860000,
      availableFormatted: 'KES 860,000',
      defaultMasked: true,
    },

    subscription: {
      status: 'Active',
      plan: 'Luxury Resort Plan',
      currentPeriod: '14 Sep – 14 Oct 2026',
      nextRenewal: '14 Oct 2026',
      paymentStatus: 'Paid',
      interval: 'Monthly',
      features: ['Multi-Department Wellness Routing', 'In-Room Concierge Dispatch', 'VIP Guest Profiling', 'Dedicated Priority SLA'],
    },

    reviews: {
      rating: 4.7,
      reviewCount: 184,
      distribution: [
        { stars: 5, percentage: 84, count: 154 },
        { stars: 4, percentage: 11, count: 20 },
        { stars: 3, percentage: 5, count: 10 },
        { stars: 2, percentage: 0, count: 0 },
        { stars: 1, percentage: 0, count: 0 },
      ],
      recentReview: {
        clientName: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Yesterday',
        comment: 'The in-room aromatherapy following our afternoon drive was absolute perfection.',
        serviceName: 'Holistic Safari Rejuvenation Ritual (120 min)',
      },
    },

    supportSafety: {
      openSupportCases: 0,
      openDisputes: 0,
      safetyReports: 0,
      activeRestrictions: 'None',
      statusText: 'No open safety concerns',
      isClean: true,
    },

    recentActivity: [
      { id: 'act-1', time: 'Today • 09:15 AM', action: 'In-Room Wellness booking #LI-61029 confirmed', type: 'booking' },
      { id: 'act-2', time: 'Yesterday • 4:00 PM', action: 'Thermal Pool maintenance cycle logged', type: 'facility' },
    ],

    internalNotes: [
      {
        id: 'note-hwr-1',
        text: 'Resort wellness operations agreement renewed for 2026-2027 season.',
        author: 'Super Admin',
        team: 'Partnership Operations',
        date: '14 Aug 2026',
      },
    ],
  },
}

/**
 * Resolves a complete 360° provider profile for any ID.
 * If the ID exists in PROVIDER_PROFILES, returns it directly.
 * Otherwise, checks DIRECTORY_PROVIDERS and dynamically crafts an authentic profile.
 */
export function getMockProviderProfile(providerId) {
  if (PROVIDER_PROFILES[providerId]) {
    return JSON.parse(JSON.stringify(PROVIDER_PROFILES[providerId]))
  }

  // Look up in DIRECTORY_PROVIDERS
  const dir = DIRECTORY_PROVIDERS.find((p) => p.id === providerId || p.dbId === providerId)
  if (dir) {
    const isSpa = dir.entityType === 'spa' || dir.typeId === 'spa'
    const isHotel = dir.entityType === 'hotel_resort' || dir.typeId === 'hotel_resort'
    const isIndividual = !isSpa && !isHotel

    const base = isSpa
      ? JSON.parse(JSON.stringify(PROVIDER_PROFILES['SPA-28192']))
      : isHotel
      ? JSON.parse(JSON.stringify(PROVIDER_PROFILES['HWR-18291']))
      : JSON.parse(JSON.stringify(PROVIDER_PROFILES['PR-82941']))

    base.id = dir.id
    base.dbId = dir.dbId || dir.id
    base.name = dir.name
    base.entityType = dir.entityType
    base.providerType = dir.typeLabel
    base.typeId = dir.typeId
    base.market = dir.market
    base.marketCode = dir.marketCode
    base.city = dir.city
    base.flag = dir.flag
    base.rating = dir.rating || 4.8
    base.reviewCount = dir.reviewCount || 95
    base.avatar = dir.avatar
    base.status = dir.status
    base.statusLabel = dir.statusLabel
    base.subscriptionPlan = dir.subscriptionPlan
    base.subscriptionRenewal = dir.subscriptionRenewal

    if (base.personalInfo) {
      base.personalInfo.fullName = dir.name
      base.personalInfo.providerId = dir.id
      base.personalInfo.email = dir.email || `${dir.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
      base.personalInfo.phone = dir.phone || '+254 712 345 678'
      base.personalInfo.city = dir.city
    }

    if (base.businessInfo) {
      base.businessInfo.businessName = dir.name
      base.businessInfo.providerId = dir.id
      base.businessInfo.email = dir.email
      base.businessInfo.phone = dir.phone
      base.businessInfo.city = dir.city
    }

    return base
  }

  // Fallback to default Grace Njeri
  return JSON.parse(JSON.stringify(PROVIDER_PROFILES['PR-82941']))
}

