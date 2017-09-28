 /* see http://www.i18nguy.com/unicode/language-identifiers.html */
var localeLanguages = [
    {
        class: 'com.serviceecho.locale.LocaleLanguage',
        id: 'en',
        name: 'English',
        code: 'en',
    },
    {
        class: 'com.serviceecho.locale.LocaleLanguage',
        id: 'fr',
        name: 'French',
        code: 'fr',
    }
];
/* NOTE: country defined by relationship */
var provinceData = [
    {
        class: 'com.serviceecho.location.Province',
        id: 'NL',
        name: 'Newfoundland and Labrador',
        abbreviation: 'N.L', // T.-N._L.
        sgcCode: '10',
        region: 'Atlantic',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'PE',
        name: 'Prince Edward Island',
        abbreviation: 'P.E.I', // I.-P.-E.
        sgcCode: '11',
        region: 'Atlantic',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'NS',
        name: 'Nova Scotia',
        abbreviation: 'N.S.', // N.-E.
        sgcCode: '12',
        region: 'Atlantic',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'NB',
        name: 'New Brunswick',
        abbreviation: 'N.B.', // N.-B.
        sgcCode: '13',
        region: 'Atlantic',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'QC',
        name: 'Quebec',
        abbreviation: 'Que.', // Qc
        sgcCode: '24',
        region: 'Quebec',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'ON',
        name: 'Ontario',
        abbreviation: 'Ont.', // Ont
        sgcCode: '35',
        region: 'Ontario',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'MB',
        name: 'Manitoba',
        abbreviation: 'Man.', // Man.
        sgcCode: '46',
        region: 'Prairies',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'SK',
        name: 'Saskatchewan',
        abbreviation: 'Sask.', // Sask.
        sgcCode: '47',
        region: 'Prairies',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'AB',
        name: 'Alberta',
        abbreviation: 'Alta.', // Alb.
        sgcCode: '48',
        region: 'Prairies',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'BC',
        name: 'British Columbia',
        abbreviation: 'B.C.', // C.-B.
        sgcCode: '59',
        region: 'British Columbia',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'YT',
        name: 'Yukon',
        abbreviation: 'Y.T.', // Yn
        sgcCode: '60',
        region: 'Territories',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'NT',
        name: 'Northwest Territories',
        abbreviation: 'N.W.T.', // T.N.-O.
        sgcCode: '61',
        region: 'Territories',
        countryId: 'CA',
    },
    {
        class: 'com.serviceecho.location.Province',
        id: 'NU',
        name: 'Nunavut',
        abbreviation: 'Nvt.', // Nt
        sgcCode: '62',
        region: 'Territories',
        countryId: 'CA',
    },
];
/* https://en.wikipedia.org/wiki/ISO_3166-2 */
var countryData = [
    {
        class: 'com.serviceecho.location.Country',
        id: 'Canada', // to match Salesforce
        name: 'Canada',
        code: 'CA',
        subdivisionNames: ['Province', 'Territory'],
    },
    {
        class: 'com.serviceecho.location.Country',
        id: 'United States',
        name: 'United States',
        code: 'US',
        subdivisionNames: ['State', 'District'],
    }
];
var statusData = [
    {
        class: 'com.serviceecho.fieldworker.Status',
        id: 'Active',
        name: 'Active'
    },
    {
        class: 'com.serviceecho.fieldworker.Status',
        id: 'Disabled',
        name: 'Disabled'
    },
    {
        class: 'com.serviceecho.fieldworker.Status',
        id: 'Long term leave',
        name: 'Long term leave'
    },
    {
        class: 'com.serviceecho.fieldworker.Status',
        id: 'Vacation',
        name: 'Vacation'
    },
    {
        class: 'com.serviceecho.fieldworker.Status',
        id: 'Break',
        name: 'Break'
    },
];
var workOrderStatusData = [
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Scheduled',
        name: 'Scheduled',
        color: '#6accbf'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'In-Progress',
        name: 'In-Progress',
        color: '#e0d907'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Paused',
        name: 'Paused',
        color: '#f3ff47'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Completed',
        name: 'Completed',
        color: '#074d17'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'En-Route',
        name: 'En-Route',
        color: '#b0b9c4'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Arrived',
        name: 'Arrived',
        color: '#11b843'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Cancelled',
        name: 'Cancelled',
        color: '#f20000'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Deferred',
        name: 'Deferred',
        color: '#ff2a12'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'No Charge',
        name: 'No Charge',
        color: '#000001'
    },
    {
        class: 'com.serviceecho.workorder.WorkOrderStatus',
        id: 'Billed',
        name: 'Billed',
        color: '#000000'
    }
];
