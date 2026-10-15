import React from "react";

const ColorInput = ({
    label,
    value,
    onChange,
    showLabel = false,
}) => {
    return (
        <s-color-field
            label={label}
            labelAccessibilityVisibility={
                showLabel ? "visible" : "exclusive"
            }
            value={value}
            onChange={(e) => {
                onChange(e.currentTarget.value.toUpperCase());
            }}
        />
    );
};

export default ColorInput;