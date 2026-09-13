import { useEffect, useState } from 'react'
import './TripList.css'

function TripList() {
  const [trips, setTrips] = useState([])
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    group_id: '',
    created_by: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tripsRes, groupsRes, usersRes] = await Promise.all([
        fetch('/api/trips'),
        fetch('/api/groups'),
        fetch('/api/users'),
      ])

      if (!tripsRes.ok) throw new Error('여행 기록을 불러오지 못했습니다.')
      if (!groupsRes.ok) throw new Error('모임 목록을 불러오지 못했습니다.')
      if (!usersRes.ok) throw new Error('사용자 목록을 불러오지 못했습니다.')

      const [tripsData, groupsData, usersData] = await Promise.all([
        tripsRes.json(),
        groupsRes.json(),
        usersRes.json(),
      ])

      setTrips(tripsData)
      setGroups(groupsData)
      setUsers(usersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.group_id || !form.created_by) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          group_id: Number(form.group_id),
          created_by: Number(form.created_by),
        }),
      })
      if (!res.ok) throw new Error('여행 기록 등록에 실패했습니다.')
      const newTrip = await res.json()
      setTrips((prev) => [newTrip, ...prev])
      setForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        group_id: '',
        created_by: '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const groupName = (id) => groups.find((g) => g.id === id)?.name
  const userName = (id) => users.find((u) => u.id === id)?.nickname

  return (
    <section className="trip-list">
      <h2>여행 기록</h2>

      <form className="trip-form" onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="여행 제목"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="설명"
          value={form.description}
          onChange={handleChange}
        />
        <div className="trip-form-dates">
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
          />
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
          />
        </div>
        <div className="trip-form-selects">
          <select
            name="group_id"
            value={form.group_id}
            onChange={handleChange}
            required
          >
            <option value="">모임 선택</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            name="created_by"
            value={form.created_by}
            onChange={handleChange}
            required
          >
            <option value="">작성자 선택</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nickname}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? '등록 중...' : '여행 기록 추가'}
        </button>
      </form>

      {error && <p className="trip-error">{error}</p>}

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <ul className="trip-items">
          {trips.map((trip) => (
            <li key={trip.id} className="trip-item">
              <h3>{trip.title}</h3>
              {trip.description && <p>{trip.description}</p>}
              {(trip.start_date || trip.end_date) && (
                <p className="trip-dates">
                  {trip.start_date || '?'} ~ {trip.end_date || '?'}
                </p>
              )}
              <p className="trip-meta">
                {groupName(trip.group_id) || `모임 #${trip.group_id}`} ·{' '}
                {userName(trip.created_by) || `작성자 #${trip.created_by}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TripList
