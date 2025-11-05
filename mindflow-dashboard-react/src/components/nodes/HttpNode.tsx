import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const NodeWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  width: '300px',
  background: '#ffffff',
  borderRadius: '8px',
  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  border: `1px solid ${theme.palette.secondary[200]}`,
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    boxShadow:
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
  },
  '&.selected': {
    borderColor: theme.palette.secondary.main,
    boxShadow: `0 0 0 2px ${theme.palette.secondary.main}, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`,
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  flexShrink: 0,
  background: theme.palette.secondary.light,
  fontSize: '22px',
}));

const NodeContent = styled(Box)({
  flex: 1,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const NodeHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
});

const CustomHandle = styled(Handle)(({ theme }) => ({
  width: '10px',
  height: '10px',
  background: '#ffffff',
  border: `2px solid ${theme.palette.secondary.main}`,
  borderRadius: '50%',
  transition: 'all 0.2s',
  '&:hover': {
    width: '12px',
    height: '12px',
    boxShadow: `0 0 0 3px ${theme.palette.secondary.main}33`,
  },
}));

const truncateUrl = (url: string) => {
  if (!url) return '';
  if (url.length <= 40) return url;
  return url.substring(0, 37) + '...';
};

const HttpNode: React.FC<NodeProps> = ({ data, selected }) => {
  const method = data.config?.method || 'GET';
  const url = data.config?.url || '';

  return (
    <NodeWrapper className={selected ? 'selected' : ''}>
      <IconWrapper>🌐</IconWrapper>
      <NodeContent>
        <NodeHeader>
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'grey.900',
              flex: 1,
            }}
          >
            {data.label || 'HTTP 请求'}
          </Typography>
          <Chip
            label={method}
            size="small"
            sx={{
              height: '20px',
              fontSize: '10px',
              fontWeight: 600,
              bgcolor: 'secondary.light',
              color: 'secondary.main',
            }}
          />
        </NodeHeader>
        {url && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: 'grey.700',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {truncateUrl(url)}
          </Typography>
        )}
      </NodeContent>
      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />
    </NodeWrapper>
  );
};

export default HttpNode;

