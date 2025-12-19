import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../utils/api';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('LTADMIN:COLLAPSE');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('LTADMIN:COLLAPSE', collapsed.toString());
  }, [collapsed]);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
            }}
          >
            Little Things
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          position: 'relative',
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          transition: theme =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Drawer
          sx={{
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: theme =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedDrawerWidth : drawerWidth,
              boxSizing: 'border-box',
              transition: theme =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar />
          <Divider />
          <List sx={{ flexGrow: 1, pt: 1 }}>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? 'Prompts' : ''} placement="right">
                <ListItemButton
                  selected={location.pathname.startsWith('/prompts')}
                  onClick={() => navigate('/prompts')}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2.5,
                    mx: collapsed ? 0.5 : 0,
                    borderRadius: collapsed ? 1 : 0,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                    }}
                  >
                    <SmartToyIcon />
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary="Prompts" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? 'Reflections' : ''} placement="right">
                <ListItemButton
                  selected={location.pathname.startsWith('/reflections')}
                  onClick={() => navigate('/reflections')}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2.5,
                    mx: collapsed ? 0.5 : 0,
                    borderRadius: collapsed ? 1 : 0,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                    }}
                  >
                    <ListAltIcon />
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary="Reflections" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip title={collapsed ? 'Members' : ''} placement="right">
                <ListItemButton
                  selected={location.pathname.startsWith('/members')}
                  onClick={() => navigate('/members')}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2.5,
                    mx: collapsed ? 0.5 : 0,
                    borderRadius: collapsed ? 1 : 0,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleIcon />
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary="Members" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip
                title={collapsed ? 'Notification' : ''}
                placement="right"
              >
                <ListItemButton
                  selected={location.pathname.startsWith('/notification')}
                  onClick={() => navigate('/notification')}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2.5,
                    mx: collapsed ? 0.5 : 0,
                    borderRadius: collapsed ? 1 : 0,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                    }}
                  >
                    <NotificationsIcon />
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary="Notification" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
          <Divider />
          <Box sx={{ p: collapsed ? 1 : 2 }}>
            <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
              <Button
                variant="outlined"
                color="error"
                startIcon={!collapsed ? <LogoutIcon /> : null}
                fullWidth={!collapsed}
                onClick={handleLogout}
                sx={{
                  minWidth: collapsed ? 40 : 'auto',
                  minHeight: collapsed ? 40 : 'auto',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  borderRadius: collapsed ? 1 : 1,
                }}
              >
                {collapsed ? <LogoutIcon /> : 'Logout'}
              </Button>
            </Tooltip>
          </Box>
        </Drawer>
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            position: 'fixed',
            left: collapsed ? collapsedDrawerWidth - 16 : drawerWidth - 16,
            top: '50vh',
            transform: 'translateY(-50%)',
            zIndex: theme => theme.zIndex.drawer + 1,
            backgroundColor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            width: 32,
            height: 32,
            transition: theme =>
              theme.transitions.create('left', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: 4,
              opacity: 1,
            },
            '&:active': {
              backgroundColor: 'background.paper',
              opacity: 1,
            },
          }}
        >
          {collapsed ? (
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          ) : (
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: collapsed
            ? `calc(100% - ${collapsedDrawerWidth}px)`
            : `calc(100% - ${drawerWidth}px)`,
          transition: theme =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
