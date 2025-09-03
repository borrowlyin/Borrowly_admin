import React from "react";
import Contactuslist from "./components/contactuslist";

const ContactUs: React.FC = () => {
  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-2">Customer Support Requests</h1>
      <p className="mb-6 text-gray-500 text-[14px]">
        Review and manage customer support requests submitted via the{" "}
        <strong>Borrowly Loan</strong> platform. <br />
        Track user issues, respond to queries, and ensure timely assistance for
        borrowers.
      </p>
      <Contactuslist />
    </div>
  );
};

export default ContactUs;
