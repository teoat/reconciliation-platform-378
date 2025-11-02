import Link from 'next/link'

const Navigation = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/projects">Projects</Link>
        </li>
        <li>
          <Link href="/data-ingestion">Data Ingestion</Link>
        </li>
        <li>
          <Link href="/reconciliation">Reconciliation</Link>
        </li>
        <li>
          <Link href="/admin">Admin</Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navigation