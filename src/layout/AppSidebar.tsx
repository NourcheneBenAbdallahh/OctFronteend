"use client";
import React, { useEffect, useMemo, useRef, useState,useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBrand from "@/components/common/AppBrand";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import { Receipt } from "lucide-react";
import { Truck } from "lucide-react";
import { Boxes } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { ArrowLeftRight, BarChart3, Ruler, Users } from "lucide-react";
import { canAccessPath, sidebarBiNavLabel } from "@/lib/access";
import { useAuthStore } from "@/store/useAuthStore";
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
 
  {
    icon: <BarChart3 className="w-5 h-5" />,
    name: "Tableau de bord",
    path: "/bi",
  },
  {
    icon: <Users className="w-5 h-5" />,
    name: "Utilisateurs",
    path: "/users",
  },
  {
    icon: <Ruler className="w-5 h-5" />,
    name: "Unités de mesure",
    path: "/unites-mesure",
  },
    {
  icon: <BoxCubeIcon />,
  name: "Emballages",
  path: "/emballages"
},
{
  icon: <UserCircleIcon />,
  name: "Fournisseurs",
  path: "/fournisseurs"
},
{
  icon: <PageIcon />,
  name: "Contrats",
  path: "/contrats"
}, {
  icon: <BoxCubeIcon />,
  name: "Entrepots",
  path: "/entrepots",
},

{
  icon: <GridIcon />,
  name: "Stocks",
  subItems: [
    { name: "Stocks", path: "/stock", pro: false },
    { name: "Mouvements", path: "/mouvements", pro: false },
    { name: "Lots", path: "/lot", pro: false },
    { name: "Inventaire", path: "/stock-inventaire", pro: false },
  ],
},

{
  icon: <ShoppingCart />,
  name: "Commandes",
  path: "/commandes"
},
{
  icon: <Truck />,
  name: "Bon Livraisons",
  path: "/bon-livraisons"

},
{
  icon: <Receipt  />,
  name: "Factures",
   path: "/factures",
},

  {
    icon: <CalenderIcon />,
    name: "Calendrier",
    path: "/calendar",
  },
  {
    icon: <PieChartIcon />,
    name: "Prévisions stock",
    path: "/prediction",
  }
];

function navItemsVisibleForRole(role: string | undefined): NavItem[] {
  const out: NavItem[] = [];
  for (const nav of navItems) {
    if (nav.subItems?.length) {
      const subs = nav.subItems.filter(
        (s) => s.path && canAccessPath(s.path, role)
      );
      if (subs.length === 0) continue;
      out.push({ ...nav, subItems: subs });
      continue;
    }
    if (nav.path && canAccessPath(nav.path, role)) {
      const item =
        nav.path === "/bi" ? { ...nav, name: sidebarBiNavLabel(role) } : nav;
      out.push(item);
    }
  }
  return out;
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const userRole = useAuthStore((s) => s.user?.role);

  const visibleNavItems = useMemo(
    () => navItemsVisibleForRole(userRole),
    [userRole]
  );

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => {
        const submenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const submenuActive = isSubmenuGroupActive(nav);

        return (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                submenuActive ? "menu-item-active" : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  submenuActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    submenuOpen ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: submenuOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
        );
      })}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isSubPathActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  );

  const isSubmenuGroupActive = useCallback(
    (nav: NavItem) =>
      nav.subItems?.some((sub) => isSubPathActive(sub.path)) ?? false,
    [isSubPathActive]
  );

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    const matchedIndex = visibleNavItems.findIndex((nav) =>
      nav.subItems?.some((sub) => isSubPathActive(sub.path))
    );
    setOpenSubmenu(
      matchedIndex >= 0 ? { type: "main", index: matchedIndex } : null
    );
  }

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex shrink-0 items-center overflow-visible border-b border-gray-100 px-3 py-5 transition-all duration-300 dark:border-gray-800 lg:py-6">
        <Link
          href="/bi"
          className={`flex w-full min-w-0 items-center ${
            isExpanded || isHovered || isMobileOpen ? "justify-start" : "justify-center"
          }`}
        >
          <AppBrand
            size="lg"
            compact={!(isExpanded || isHovered || isMobileOpen)}
            className="w-full"
          />
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 pt-5">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase tracking-[0.35em] flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "MENU"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(visibleNavItems, "main")}
            </div>

       
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
