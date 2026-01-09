import React from "react";
import LoanList from "./components/LoanList"
const LoanApplication: React.FC = () => {
  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-2">Loan Queniqer Leads</h1>
      <p className="mb-6 text-gray-500 text-[14px]">
        Review and manage loan leads generated via the{" "}
        <strong>Loan Queniqer</strong> application. <br />
        Track borrower inquiries, follow up with prospects, and convert leads
        into successful loan applications.
      </p>
      <LoanList />
    </div>
  );
};

export default LoanApplication;
