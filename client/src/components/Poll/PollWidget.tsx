import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, IconButton, Radio, RadioGroup, FormControlLabel, FormControl, LinearProgress, Chip } from '@mui/material';
import { Close, Poll, ExpandLess, ExpandMore } from '@mui/icons-material';
import { pollService, pollOptionService, pollResponseService } from '../../services/database';
import { Poll as PollType, PollOption } from '../../lib/supabase';
import { useAuth } from '../Auth/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

const PollWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePoll, setActivePoll] = useState<PollType | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [totalResponses, setTotalResponses] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load active poll
  useEffect(() => {
    const loadActivePoll = async () => {
      try {
        const polls = await pollService.getActive();
        if (polls.length > 0) {
          const poll = polls[0]; // Get first active poll
          setActivePoll(poll);
          
          const options = await pollOptionService.getByPollId(poll.id);
          setPollOptions(options);
          
          // Check if user has voted
          if (user?.username) {
            const userResponse = await pollResponseService.getUserResponse(poll.id, user.username);
            if (userResponse) {
              setHasVoted(true);
              setSelectedOption(userResponse.option_id);
            }
          }
          
          // Load response counts
          const counts = await pollResponseService.getResponseCounts(poll.id);
          setResponseCounts(counts);
          const total = await pollResponseService.getTotalResponses(poll.id);
          setTotalResponses(total);
        }
      } catch (error) {
        console.error('Failed to load active poll:', error);
      }
    };
    
    loadActivePoll();
    
    // Check localStorage for widget state
    const widgetState = localStorage.getItem('pollWidgetOpen');
    if (widgetState === 'true') {
      setIsOpen(true);
    }
  }, [user]);

  const handleVote = async () => {
    if (!selectedOption || !activePoll) return;
    
    setLoading(true);
    try {
      await pollResponseService.submit(activePoll.id, selectedOption, user?.username || null);
      setHasVoted(true);
      
      // Reload response counts
      const counts = await pollResponseService.getResponseCounts(activePoll.id);
      setResponseCounts(counts);
      const total = await pollResponseService.getTotalResponses(activePoll.id);
      setTotalResponses(total);
      
      toast.success('Thank you for voting!');
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('You have already voted on this poll');
      } else {
        toast.error('Failed to submit vote');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('pollWidgetOpen', 'false');
  };

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('pollWidgetOpen', newState.toString());
  };

  if (!activePoll) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            startIcon={<Poll />}
            onClick={handleToggle}
            sx={{
              bgcolor: '#b40202',
              '&:hover': { bgcolor: '#8b0101' },
              borderRadius: '25px',
              px: 3,
              py: 1.5,
              boxShadow: '0 4px 20px rgba(180, 2, 2, 0.4)',
            }}
          >
            Vote Now
          </Button>
        </motion.div>
      )}

      {/* Poll Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: 20,
              zIndex: 1000,
              width: isMinimized ? '300px' : '400px',
              maxWidth: '90vw',
            }}
          >
            <Card
              sx={{
                bgcolor: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(180, 2, 2, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {activePoll.title}
                    </Typography>
                    {activePoll.description && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
                        {activePoll.description}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => setIsMinimized(!isMinimized)}
                      sx={{ color: '#ffffff' }}
                    >
                      {isMinimized ? <ExpandMore /> : <ExpandLess />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleClose}
                      sx={{ color: '#ffffff' }}
                    >
                      <Close />
                    </IconButton>
                  </Box>
                </Box>

                {!isMinimized && (
                  <>
                    {!hasVoted ? (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        >
                          {pollOptions.map((option) => (
                            <FormControlLabel
                              key={option.id}
                              value={option.id}
                              control={<Radio sx={{ color: '#b40202' }} />}
                              label={
                                <Typography sx={{ color: '#ffffff' }}>
                                  {option.option_text}
                                </Typography>
                              }
                              sx={{ mb: 1 }}
                            />
                          ))}
                        </RadioGroup>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleVote}
                          disabled={!selectedOption || loading}
                          sx={{
                            mt: 2,
                            bgcolor: '#b40202',
                            '&:hover': { bgcolor: '#8b0101' },
                          }}
                        >
                          {loading ? 'Submitting...' : 'Submit Vote'}
                        </Button>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                          Thank you for voting! Results:
                        </Typography>
                        {pollOptions.map((option) => {
                          const count = responseCounts[option.id] || 0;
                          const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                          return (
                            <Box key={option.id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  {option.option_text}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {count} ({percentage.toFixed(1)}%)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: '#b40202',
                                  },
                                }}
                              />
                            </Box>
                          );
                        })}
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1, display: 'block' }}>
                          Total votes: {totalResponses}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PollWidget;

