import React from "react";
import { Link, useLocation } from "react-router-dom";
import { settingsLocation } from "./settingsRoute";

type SettingsLinkProps = Omit<React.ComponentProps<typeof Link>, "to"> & {
  section?: string;
};

/** Opens Settings over the current route instead of replacing the current tool. */
export const SettingsLink: React.FC<SettingsLinkProps> = ({ section, ...props }) => {
  const location = useLocation();
  return <Link {...props} to={settingsLocation(location, section)} />;
};
