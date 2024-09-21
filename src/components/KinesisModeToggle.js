// components/KinesisModeToggle.js
import React from 'react';
import {Switch, FormControlLabel} from '@mui/material';
import {useKinesisMode} from '@/contexts/KinesisModeContext';

const KinesisModeToggle = () => {
    const {useRealKinesis, setUseRealKinesis} = useKinesisMode();

    return (
        <FormControlLabel
            control={
                <Switch
                    checked={useRealKinesis}
                    onChange={(e) => setUseRealKinesis(e.target.checked)}
                    color="secondary"
                />
            }
            label={useRealKinesis ? "Real Kinesis" : "Mock Kinesis"}
        />
    );
};

export default KinesisModeToggle;
