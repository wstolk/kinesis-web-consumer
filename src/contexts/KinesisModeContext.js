// contexts/KinesisModeContext.js
import React, {createContext, useState, useContext} from 'react';

const KinesisModeContext = createContext();

export const KinesisModeProvider = ({children}) => {
    const [useRealKinesis, setUseRealKinesis] = useState(false);

    return (
        <KinesisModeContext.Provider value={{useRealKinesis, setUseRealKinesis}}>
            {children}
        </KinesisModeContext.Provider>
    );
};

export const useKinesisMode = () => useContext(KinesisModeContext);