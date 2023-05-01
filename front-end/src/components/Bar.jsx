import React, { useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import { MdCategory } from "react-icons/md";
import PersonIcon from "@mui/icons-material/Person";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { VscLibrary } from "react-icons/vsc";
import { ImBook } from "react-icons/im";
import { AiOutlineFile } from "react-icons/ai";
import SettingsIcon from "@mui/icons-material/Settings";

import history from "../history";
import { Stack } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const NavBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const Bar = (props) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const identity = useSelector((state) => state.identity);
  const location = useLocation();
  const [selectedRoute, setSelectedRoute] = useState("Home");
  let parts = location.pathname.split("/").filter((x) => x);
  if (parts.length === 9) {
    if (
      parts[0] === "courses" &&
      parts[1].length === 32 &&
      parts[2] === "units" &&
      parts[3].length === 32 &&
      parts[4] == "pools" &&
      parts[5].length == 32 &&
      parts[6] === "questions" &&
      parts[7].length == 32 &&
      parts[8] === "IDE"
    ) {
      return null;
    }
  }

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  let admin_dash = null;

  if (identity.type === "lecturer") {
    admin_dash = (
      <>
        <List>
          {open && (
            <ListItem sx={{ display: "block" }}>
              <ListItemText>Admin items</ListItemText>
            </ListItem>
          )}
          {/* Courses */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/courses");
                setSelectedRoute("Courses");
              }}
              selected={selectedRoute === "Courses"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <VscLibrary />
              </ListItemIcon>
              <ListItemText
                primary={"Courses"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
          {/* Units */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/units");
                setSelectedRoute("Units");
              }}
              selected={selectedRoute === "Units"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <ImBook />
              </ListItemIcon>
              <ListItemText primary={"Units"} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          {/* Questions */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/questions");
                setSelectedRoute("Questions");
              }}
              selected={selectedRoute === "Questions"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <AiOutlineFile />
              </ListItemIcon>
              <ListItemText
                primary={"Questions"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
          {/* Fragments */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/misc");
                setSelectedRoute("Misc");
              }}
              selected={selectedRoute === "Misc"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <MdCategory />
              </ListItemIcon>
              <ListItemText
                primary={"Fragments"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          {/* Stats */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/stats");
                setSelectedRoute("Stats");
              }}
              selected={selectedRoute === "Stats"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <QueryStatsIcon />
              </ListItemIcon>
              <ListItemText primary={"Stats"} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          {/* User manager */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={() => {
                history.push("/users/edit");
                setSelectedRoute("Users");
              }}
              selected={selectedRoute === "Users"}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary={"User management"}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <CssBaseline />
      <NavBar position="fixed" open={open}>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{
            marginRight: "10px",
          }}
        >
          <Toolbar>
            {identity.id ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{
                  marginRight: 2,
                  ...(open && { display: "none" }),
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : null}

            <Typography variant="h6" noWrap component="div">
              SunCoder
            </Typography>
          </Toolbar>
        </Stack>
      </NavBar>
      {identity.id ? (
        <Drawer variant="permanent" open={open} sx={{ position: "relative" }}>
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </DrawerHeader>
          <Divider />
          {/* NORMAL USER ITEMS */}
          <List>
            {/* HOME */}
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justiftContent: open ? "initial" : "center",
                  px: 2.5,
                }}
                onClick={() => {
                  history.push("/");
                  setSelectedRoute("Home");
                }}
                selected={selectedRoute === "Home"}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary={"Home"} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          <List>
            {/* REGISTER FOR COURSE */}
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justiftContent: open ? "initial" : "center",
                  px: 2.5,
                }}
                onClick={() => {
                  history.push("/settings");
                  setSelectedRoute("Settings");
                }}
                selected={selectedRoute === "Settings"}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Settings"}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
          {/* ADMIN USER ITEMS */}
          {admin_dash}
        </Drawer>
      ) : null}

      <Box
        id="bar-body"
        component="div"
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DrawerHeader />
        {props.children}
      </Box>
    </Box>
  );
};

export default Bar;
