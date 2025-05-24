import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { FaChartLine, FaUsers, FaShoppingCart } from "react-icons/fa";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const LoginSelector = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const roles = [
    {
      id: "marketing",
      title: "Marketing",
      description: "Access analytics, campaigns, and customer insights",
      icon: <FaChartLine className="text-3xl text-blue-500" />,
      color: "from-blue-500 to-blue-400",
    },
    {
      id: "sales",
      title: "Sales",
      description: "Manage leads, opportunities, and sales pipelines",
      icon: <FaShoppingCart className="text-3xl text-green-500" />,
      color: "from-green-500 to-green-400",
    },
    {
      id: "client",
      title: "Client",
      description: "View your account, orders, and support tickets",
      icon: <FaUsers className="text-3xl text-purple-500" />,
      color: "from-purple-500 to-purple-400",
    },
  ];

  const handleContinue = () => {
    navigate("/login", { state: { role: selectedRole } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Welcome to DXD Magnate
        </h1>
        <p className="text-lg text-gray-600">
          Select your role to continue to the login page
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 ${
              selectedRole === role.id
                ? "border-blue-500 shadow-lg"
                : "border-transparent hover:border-gray-200"
            }`}
          >
            <div
              className={`h-2 bg-gradient-to-r ${role.color} w-full`}
            ></div>
            <div className="p-6 flex flex-col items-center">
              <div className="mb-4 p-3 bg-gray-50 rounded-full">
                {role.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {role.title}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {role.description}
              </p>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedRole === role.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {selectedRole === role.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="contained"
        color="primary"
        size="large"
        disabled={!selectedRole}
        onClick={handleContinue}
        endIcon={<MdOutlineKeyboardArrowRight />}
        className={`transition-all duration-300 ${
          selectedRole ? "opacity-100" : "opacity-70"
        }`}
        sx={{
          padding: "12px 24px",
          borderRadius: "12px",
          fontSize: "1rem",
          fontWeight: "600",
          textTransform: "none",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 6px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        Continue
      </Button>
    </div>
  );
};

export default LoginSelector;