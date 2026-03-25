import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Divider, Tooltip, useTheme, Dialog, DialogTitle, DialogContent, IconButton, InputBase } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';

const StatusDot = ({ status, size = 6 }) => {
    const colorMap = {
        ACTIVE: 'success.main',
        CREATING: 'warning.main',
        UPDATING: 'warning.main',
        DELETING: 'error.main',
    };
    return (
        <Box
            component="span"
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: colorMap[status] || 'text.disabled',
                display: 'inline-block',
                mr: 0.5,
                flexShrink: 0,
                ...(status === 'ACTIVE' && {
                    boxShadow: (theme) => `0 0 4px ${theme.palette.success.main}`,
                }),
            }}
        />
    );
};

const InfoRow = ({ label, value, icon, tooltip, mono = true }) => {
    const content = (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.4,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {icon && React.cloneElement(icon, {
                    sx: { fontSize: 12, color: 'text.disabled', ...icon.props.sx }
                })}
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {label}
                </Typography>
            </Box>
            <Typography
                variant="caption"
                sx={(theme) => ({
                    fontFamily: mono ? theme.typography.mono : undefined,
                    fontSize: '0.75rem',
                    color: 'text.primary',
                })}
            >
                {value}
            </Typography>
        </Box>
    );

    return tooltip ? <Tooltip title={tooltip} placement="left">{content}</Tooltip> : content;
};

const CopyableValue = ({ value, label }) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef(null);
    const theme = useTheme();

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // ignore
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
                variant="caption"
                noWrap
                sx={{
                    fontFamily: theme.typography.mono,
                    fontSize: '0.75rem',
                    color: 'text.primary',
                    flex: 1,
                    minWidth: 0,
                }}
            >
                {value}
            </Typography>
            <IconButton
                size="small"
                onClick={handleCopy}
                aria-label={`Copy ${label}`}
                sx={{ p: 0.25, flexShrink: 0, transition: 'color 200ms cubic-bezier(0.25, 1, 0.5, 1)' }}
            >
                {copied
                    ? <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />
                    : <ContentCopyIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                }
            </IconButton>
        </Box>
    );
};

// --- Detail Modal ---

const DetailRow = ({ label, children }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'baseline', py: 0.5 }}>
            <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                minWidth: 100,
                flexShrink: 0,
            }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {children}
            </Box>
        </Box>
    );
};

const truncateHash = (hash) => {
    if (!hash || hash.length <= 12) return hash || '-';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const ShardRow = ({ shard, theme, isEven }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
        px: 1,
        bgcolor: isEven ? 'transparent' : 'surface.main',
        transition: 'background-color 120ms cubic-bezier(0.25, 1, 0.5, 1)',
        '&:hover': { bgcolor: 'action.hover' },
        minHeight: 30,
    }}>
        <Typography variant="caption" noWrap sx={{
            fontFamily: theme.typography.mono,
            fontSize: '0.75rem',
            color: 'text.primary',
            flex: '0 0 160px',
        }}>
            {shard.shardId}
        </Typography>
        {shard.parentShardId && (
            <Tooltip title={`Parent: ${shard.parentShardId}`}>
                <Typography variant="caption" noWrap sx={{
                    fontFamily: theme.typography.mono,
                    fontSize: '0.6875rem',
                    color: 'text.disabled',
                    flex: '0 0 80px',
                    px: 0.5,
                }}>
                    ← {shard.parentShardId.replace('shardId-', '').slice(0, 8)}
                </Typography>
            </Tooltip>
        )}
        {!shard.parentShardId && (
            <Box sx={{ flex: '0 0 80px' }} />
        )}
        <Typography variant="caption" noWrap sx={{
            fontFamily: theme.typography.mono,
            fontSize: '0.6875rem',
            color: 'text.secondary',
            flex: 1,
            minWidth: 0,
        }}>
            {shard.startingHashKey || '-'}
        </Typography>
        <Typography variant="caption" noWrap sx={{
            fontFamily: theme.typography.mono,
            fontSize: '0.6875rem',
            color: 'text.secondary',
            flex: 1,
            minWidth: 0,
            textAlign: 'right',
        }}>
            {shard.endingHashKey || '-'}
        </Typography>
    </Box>
);

const StreamDetailModal = ({ open, onClose, streamInfo }) => {
    const [shardFilter, setShardFilter] = useState('');
    const theme = useTheme();

    const filteredShards = useMemo(() => {
        const shards = streamInfo?.shards || [];
        if (!shardFilter) return shards;
        const q = shardFilter.toLowerCase();
        return shards.filter(s =>
            s.shardId.toLowerCase().includes(q) ||
            (s.parentShardId && s.parentShardId.toLowerCase().includes(q))
        );
    }, [streamInfo?.shards, shardFilter]);

    if (!streamInfo) return null;

    const retentionDays = streamInfo.retentionPeriodHours
        ? (streamInfo.retentionPeriodHours / 24).toFixed(streamInfo.retentionPeriodHours % 24 === 0 ? 0 : 1)
        : null;
    const isEncrypted = streamInfo.encryptionType && streamInfo.encryptionType !== 'NONE';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionProps={{ timeout: { enter: 200, exit: 150 } }}
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'surface.border',
                        maxHeight: '80vh',
                    },
                },
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'surface.border',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                        Stream Details
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {/* Overview section */}
                <Box sx={{ px: 2, py: 1.5 }}>
                    {/* Name + Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{
                            fontFamily: theme.typography.mono,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'text.primary',
                        }}>
                            {streamInfo.streamName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'surface.main', px: 1, py: 0.25, borderRadius: '4px' }}>
                            <StatusDot status={streamInfo.streamStatus} size={7} />
                            <Typography variant="caption" sx={{
                                fontFamily: theme.typography.mono,
                                fontSize: '0.6875rem',
                                color: 'text.secondary',
                            }}>
                                {streamInfo.streamStatus}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ARN */}
                    {streamInfo.streamARN && (
                        <DetailRow label="ARN">
                            <CopyableValue value={streamInfo.streamARN} label="ARN" />
                        </DetailRow>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Properties grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                        <DetailRow label="Mode">
                            <Typography variant="caption" sx={{ fontFamily: theme.typography.mono, fontSize: '0.75rem' }}>
                                {streamInfo.streamMode === 'ON_DEMAND' ? 'on-demand' : 'provisioned'}
                            </Typography>
                        </DetailRow>
                        <DetailRow label="Shards">
                            <Typography variant="caption" sx={{ fontFamily: theme.typography.mono, fontSize: '0.75rem' }}>
                                {streamInfo.shardCount}
                            </Typography>
                        </DetailRow>
                        {retentionDays && (
                            <DetailRow label="Retention">
                                <Typography variant="caption" sx={{ fontFamily: theme.typography.mono, fontSize: '0.75rem' }}>
                                    {retentionDays} days ({streamInfo.retentionPeriodHours}h)
                                </Typography>
                            </DetailRow>
                        )}
                        <DetailRow label="Encryption">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {isEncrypted
                                    ? <LockOutlinedIcon sx={{ fontSize: 12, color: 'success.main' }} />
                                    : <LockOpenOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                }
                                <Typography variant="caption" sx={{ fontFamily: theme.typography.mono, fontSize: '0.75rem' }}>
                                    {isEncrypted ? streamInfo.encryptionType : 'none'}
                                </Typography>
                            </Box>
                        </DetailRow>
                    </Box>
                </Box>

                {/* Shards section */}
                {streamInfo.shards && streamInfo.shards.length > 0 && (
                    <Box>
                        <Box sx={{
                            px: 2,
                            py: 0.75,
                            bgcolor: 'surface.main',
                            borderTop: '1px solid',
                            borderBottom: '1px solid',
                            borderColor: 'surface.border',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}>
                            <Typography variant="caption" sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                flexShrink: 0,
                            }}>
                                Shards
                            </Typography>
                            <Typography variant="caption" sx={{
                                fontFamily: theme.typography.mono,
                                fontSize: '0.6875rem',
                                color: 'text.disabled',
                                flexShrink: 0,
                            }}>
                                {filteredShards.length !== streamInfo.shardCount
                                    ? `${filteredShards.length} / ${streamInfo.shardCount}`
                                    : streamInfo.shardCount
                                }
                            </Typography>
                            {streamInfo.shardCount > 5 && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 24,
                                    border: '1px solid',
                                    borderColor: 'surface.border',
                                    borderRadius: '4px',
                                    bgcolor: 'background.paper',
                                    px: 0.75,
                                    ml: 'auto',
                                    flex: '0 1 180px',
                                    transition: 'border-color 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                                    '&:focus-within': { borderColor: 'primary.main' },
                                }}>
                                    <SearchIcon sx={{ fontSize: 13, color: 'text.disabled', mr: 0.5 }} />
                                    <InputBase
                                        placeholder="Filter shards..."
                                        value={shardFilter}
                                        onChange={(e) => setShardFilter(e.target.value)}
                                        inputProps={{ 'aria-label': 'Filter shards' }}
                                        sx={{
                                            flex: 1,
                                            fontFamily: theme.typography.mono,
                                            fontSize: '0.6875rem',
                                            '& input::placeholder': {
                                                fontFamily: theme.typography.mono,
                                                fontSize: '0.6875rem',
                                                opacity: 0.5,
                                            },
                                        }}
                                    />
                                    {shardFilter && (
                                        <IconButton size="small" onClick={() => setShardFilter('')} sx={{ p: 0.15 }}>
                                            <CloseIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* Shard table header */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 0.4,
                            px: 1,
                            borderBottom: '1px solid',
                            borderColor: 'surface.border',
                        }}>
                            {[
                                { label: 'Shard ID', flex: '0 0 160px' },
                                { label: 'Parent', flex: '0 0 80px' },
                                { label: 'Start Hash', flex: 1 },
                                { label: 'End Hash', flex: 1, align: 'right' },
                            ].map(col => (
                                <Typography key={col.label} variant="caption" sx={{
                                    fontFamily: theme.typography.mono,
                                    fontSize: '0.6875rem',
                                    color: 'text.disabled',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    flex: col.flex,
                                    textAlign: col.align || 'left',
                                }}>
                                    {col.label}
                                </Typography>
                            ))}
                        </Box>

                        {/* Shard rows */}
                        <Box sx={{ maxHeight: Math.min(filteredShards.length * 30 + 8, 350), overflow: 'auto' }}>
                            {filteredShards.length > 0 ? (
                                filteredShards.map((shard, i) => (
                                    <ShardRow key={shard.shardId} shard={shard} theme={theme} isEven={i % 2 === 0} />
                                ))
                            ) : (
                                <Typography variant="caption" sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    py: 2,
                                    color: 'text.disabled',
                                    fontSize: '0.75rem',
                                }}>
                                    No shards match &quot;{shardFilter}&quot;
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

// --- Sidebar Panel ---

const StreamInfo = ({ streamInfo }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const theme = useTheme();

    if (!streamInfo) return null;

    const retentionDays = streamInfo.retentionPeriodHours
        ? (streamInfo.retentionPeriodHours / 24).toFixed(streamInfo.retentionPeriodHours % 24 === 0 ? 0 : 1)
        : null;

    const isEncrypted = streamInfo.encryptionType && streamInfo.encryptionType !== 'NONE';

    return (
        <>
            <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <StorageIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Stream
                    </Typography>
                </Box>

                <Box
                    onClick={() => setModalOpen(true)}
                    sx={{
                        bgcolor: 'surface.main',
                        border: '1px solid',
                        borderColor: 'surface.border',
                        borderRadius: '4px',
                        px: 1.25,
                        py: 0.75,
                        cursor: 'pointer',
                        transition: 'border-color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                        '&:hover': {
                            borderColor: 'primary.main',
                        },
                    }}
                >
                    {/* Stream name + status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
                        <Typography
                            variant="body2"
                            noWrap
                            sx={{
                                fontFamily: theme.typography.mono,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'text.primary',
                                maxWidth: '60%',
                            }}
                        >
                            {streamInfo.streamName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <StatusDot status={streamInfo.streamStatus} />
                                <Typography variant="caption" sx={{
                                    fontSize: '0.6875rem',
                                    fontFamily: theme.typography.mono,
                                    color: 'text.secondary',
                                    textTransform: 'lowercase',
                                }}>
                                    {streamInfo.streamStatus?.toLowerCase()}
                                </Typography>
                            </Box>
                            <OpenInNewIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <InfoRow
                        label="Shards"
                        value={streamInfo.shardCount}
                    />
                    <InfoRow
                        label="Mode"
                        value={streamInfo.streamMode === 'ON_DEMAND' ? 'on-demand' : 'provisioned'}
                    />
                    {retentionDays && (
                        <InfoRow
                            label="Retention"
                            value={`${retentionDays}d`}
                        />
                    )}
                    <InfoRow
                        label="Encryption"
                        value={isEncrypted ? streamInfo.encryptionType : 'none'}
                    />
                </Box>
            </Box>

            <StreamDetailModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                streamInfo={streamInfo}
            />
        </>
    );
};

export default React.memo(StreamInfo);
