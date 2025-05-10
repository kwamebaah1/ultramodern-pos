"use client";

import React, { useState } from "react";

const Popover = ({
  trigger,
  children,
  align = "center",
  sideOffset = 4,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const alignmentClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };

  return (
    <div className={`relative inline-flex ${alignmentClasses[align]}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}
          style={{ top: "100%", marginTop: `${sideOffset}px` }}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const PopoverTrigger = ({ children, className = "", ...props }) => {
  return (
    <div className={`cursor-pointer ${className}`} {...props}>
      {children}
    </div>
  );
};

const PopoverContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Popover, PopoverTrigger, PopoverContent };