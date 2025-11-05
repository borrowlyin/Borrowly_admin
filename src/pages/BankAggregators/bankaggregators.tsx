import React, { useEffect, useState } from "react";
import axios from "axios";

interface Bank {
  id: number;
  fullname: string;
  phonenumber: string;
  bankname: string;
  ifsccode: string;
  branchname: string;
  created_at: string;
  updated_at: string;
}

const BankAggregators: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get("http://localhost:4528/api/getAllBanks");
        setBanks(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch bank details");
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px", fontSize: "18px" }}>
        Loading bank details...
      </div>
    );

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        {error}
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#0d6efd",
            color: "#fff",
            padding: "20px 30px",
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          Bank Aggregator Dashboard
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "15px",
              color: "#333",
            }}
          >
            <thead style={{ backgroundColor: "#f1f3f6", textAlign: "left" }}>
              <tr>
                {[
                  "ID",
                  "Full Name",
                  "Phone Number",
                  "Bank Name",
                  "IFSC Code",
                  "Branch Name",
                  "Created At",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      borderBottom: "2px solid #e0e0e0",
                      textTransform: "uppercase",
                      fontSize: "13px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banks.map((bank, index) => (
                <tr
                  key={bank.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafbfc",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#eef6ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#fff" : "#fafbfc")
                  }
                >
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>{bank.id}</td>
                  <td style={{ padding: "14px 20px" }}>{bank.fullname}</td>
                  <td style={{ padding: "14px 20px" }}>{bank.phonenumber}</td>
                  <td style={{ padding: "14px 20px" }}>{bank.bankname}</td>
                  <td
                    style={{
                      padding: "14px 20px",
                      color: "#0d6efd",
                      fontWeight: 500,
                    }}
                  >
                    {bank.ifsccode}
                  </td>
                  <td style={{ padding: "14px 20px" }}>{bank.branchname}</td>
                  <td style={{ padding: "14px 20px" }}>
                    {new Date(bank.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: "14px 20px",
            textAlign: "right",
            fontSize: "14px",
            color: "#666",
            borderTop: "1px solid #eee",
          }}
        >
          Total Banks: <strong>{banks.length}</strong>
        </div>
      </div>
    </div>
  );
};

export default BankAggregators;
