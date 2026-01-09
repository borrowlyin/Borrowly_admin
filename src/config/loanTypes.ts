export const loanTypeConfigs = {
  gold: {
    loanType: "gold",
    displayName: "Gold Loan",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back", "gold_certificate", "valuation_report"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      amount: "Loan Amount",
      gold_weight: "Gold Weight (grams)",
      gold_purity: "Gold Purity (karat)",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "cancel"]
  },
  
  personal: {
    loanType: "personal",
    displayName: "Personal Loan",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back", "bankstatement_url", "payslip_url"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      businessdesiredloanamount: "Amount",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "cancel"]
  },
  
  home: {
    loanType: "home",
    displayName: "Home Loan",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back", "property_documents", "income_proof"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      amount: "Loan Amount",
      property_value: "Property Value",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "document_pending"]
  },
  
  business: {
    loanType: "business",
    displayName: "Business Loan",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back", "business_registration", "financial_statements"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      amount: "Loan Amount",
      business_turnover: "Annual Turnover",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "verification_pending"]
  },
  
  vehicle: {
    loanType: "vehicle",
    displayName: "Vehicle Loan",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back", "vehicle_invoice", "insurance_copy"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      amount: "Loan Amount",
      vehicle_price: "Vehicle Price",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "documentation_pending"]
  },
  
  insurance: {
    loanType: "insurance",
    displayName: "Insurance",
    documentKeys: ["panurl", "adharurl_front", "adharurl_back"],
    fieldLabelMap: {
      fullname: "Full Name",
      mobile: "Mobile Number",
      email: "Email",
      amount: "Annual Income",
      status: "Application Status",
      reason: "Reason",
    },
    statusOptions: ["pending", "approved", "rejected", "cancel"]
  }
};