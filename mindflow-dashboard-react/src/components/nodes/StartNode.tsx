import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const NodeWrapper = styled(Box)(({ theme }) => ({
  padding: '12px 20px',
  borderRadius: '24px',
  background: theme.palette.primary.main,
  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
  border: `1px solid ${theme.palette.primary[200]}`,
  minWidth: '110px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    borderColor: theme.palette.primary.dark,
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`,
  },
}));

const NodeContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
});

const CustomHandle = styled(Handle)(({ theme }) => ({
  width: '10px',
  height: '10px',
  background: '#ffffff',
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: '50%',
  transition: 'all 0.2s',
  '&:hover': {
    width: '12px',
    height: '12px',
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
  },
}));

const StartNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <NodeWrapper className={selected ? 'selected' : ''}>
      <NodeContent>
        <span style={{ fontSize: '16px' }}>▶️</span>
        <Typography
          variant="body2"
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'white',
            letterSpacing: '0.3px',
          }}
        >
          {data.label || '开始'}
        </Typography>
      </NodeContent>
      <CustomHandle type="source" position={Position.Right} />
    </NodeWrapper>
  );
};

export default StartNode;

