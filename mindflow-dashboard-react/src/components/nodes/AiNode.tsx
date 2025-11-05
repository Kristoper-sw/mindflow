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
  border: '1px solid #69f0ae',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.success.main,
    boxShadow:
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
  },
  '&.selected': {
    borderColor: theme.palette.success.main,
    boxShadow: `0 0 0 2px ${theme.palette.success.main}, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`,
  },
}));

const IconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  flexShrink: 0,
  background: '#cdf5d8',
  fontSize: '22px',
});

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
  border: `2px solid ${theme.palette.success.main}`,
  borderRadius: '50%',
  transition: 'all 0.2s',
  '&:hover': {
    width: '12px',
    height: '12px',
    boxShadow: `0 0 0 3px ${theme.palette.success.main}33`,
  },
}));

const truncateText = (text: string) => {
  if (!text) return '';
  if (text.length <= 50) return text;
  return text.substring(0, 47) + '...';
};

const shortenModel = (model: string) => {
  if (!model) return '';
  const mapping: { [key: string]: string } = {
    'gpt-3.5-turbo': 'GPT-3.5',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4T',
  };
  return mapping[model] || model.substring(0, 8);
};

const AiNode: React.FC<NodeProps> = ({ data, selected }) => {
  const model = data.config?.model || '';
  const prompt = data.config?.prompt || '';

  return (
    <NodeWrapper className={selected ? 'selected' : ''}>
      <IconWrapper>🤖</IconWrapper>
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
            {data.label || 'AI 处理'}
          </Typography>
          {model && (
            <Chip
              label={shortenModel(model)}
              size="small"
              sx={{
                height: '20px',
                fontSize: '10px',
                fontWeight: 600,
                bgcolor: '#cdf5d8',
                color: '#00c853',
              }}
            />
          )}
        </NodeHeader>
        {prompt && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: 'grey.700',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {truncateText(prompt)}
          </Typography>
        )}
      </NodeContent>
      <CustomHandle type="target" position={Position.Left} />
      <CustomHandle type="source" position={Position.Right} />
    </NodeWrapper>
  );
};

export default AiNode;

