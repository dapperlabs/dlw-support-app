import { NavLink } from 'react-router-dom'

/**
 * Navigation menu component
 * Renders a list of navigation links with active state styling
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string[]} props.links - Array of route names to create navigation links
 * @returns {JSX.Element} Navigation menu with styled links
 * 
 * @example
 * // Usage:
 * <Menu links={['transactions', 'cryptokitties', 'ERC20', 'ERC721']} />
 */
const Menu: React.FC<{ links: string[] }> = ({ links }) => {
    return (
        <ul>
            {links.map((link: string, i: number) =>
                <li key={i}><NavLink to={`/${link}`} style={({ isActive }) => ({
                    textDecoration: isActive ? 'underline' : 'none',
                    fontWeight: isActive ? 'bold' : 'normal'
                  })}>{link}</NavLink></li>
            )}
        </ul>
    )
}

export default Menu
