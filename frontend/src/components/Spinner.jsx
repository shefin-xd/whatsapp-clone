// frontend/src/components/Spinner.jsx
import React from 'react';

const Spinner = () => {
    return (
        <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>
    );
};

export default Spinner;
