import React, { useState } from 'react'
import { ArrowLeftIcon, SearchIcon, LoaderCircleIcon, Sparkles, Star, Zap, Award, TrendingUp, BadgeCheck, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'

const SkillTag = ({ name, percentage, type }) => {
  const colors = {
    must: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    good: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
    bonus: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100'
  }

  const icons = {
    must: <Star className='size-3.5 fill-emerald-400 text-emerald-400' />,
    good: <Zap className='size-3.5 text-blue-400' />,
    bonus: <Award className='size-3.5 text-purple-400' />
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium ${colors[type]} hover:ring-2 transition-all cursor-default`}>
      {icons[type]}
      <span>{name}</span>
      {percentage > 0 && <span className='text-xs opacity-60'>({percentage}%)</span>}
    </div>
  )
}

const SkillRecommender = () => {
  const { token } = useSelector(state => state.auth)
  const [role, setRole] = useState('')
  const [level, setLevel] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState(null)

  const levels = [
    { value: '', label: 'All Levels' },
    { value: 'junior', label: 'Junior / Fresher' },
    { value: 'mid-level', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' }
  ]

  const popularRoles = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'DevOps Engineer', 'UI/UX Designer',
    'Machine Learning Engineer', 'Product Manager', 'Mobile Developer',
    'Cloud Architect', 'QA Engineer', 'Cybersecurity Analyst'
  ]

  const handleSearch = async (searchRole) => {
    const queryRole = searchRole || role
    if (!queryRole.trim()) {
      toast.error('Please enter a role to search.')
      return
    }

    setIsSearching(true)
    try {
      const { data } = await api.post('/api/ai/recommend-skills', { role: queryRole, level }, {
        headers: { Authorization: token }
      })
      setResult(data)
      if (searchRole) setRole(searchRole)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Skill recommendation failed. Make sure the ML server is running.')
    }
    setIsSearching(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-8'>
      {/* Header */}
      <Link to='/app' className='inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all mb-6'>
        <ArrowLeftIcon className='size-4' /> Back to Dashboard
      </Link>

      <div className='text-center mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-medium mb-3'>
          <Sparkles className='size-4' /> AI Skill Recommender
        </div>
        <h1 className='text-3xl font-bold text-slate-800'>Find Skills for Any Role</h1>
        <p className='text-slate-500 mt-2 max-w-lg mx-auto'>
          Search any job role and experience level — our AI will tell you exactly which skills you need to learn.
        </p>
      </div>

      {/* Search Section */}
      <div className='max-w-2xl mx-auto mb-8'>
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='flex-1 relative'>
              <SearchIcon className='absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400' />
              <input
                type='text'
                value={role}
                onChange={e => setRole(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. Frontend Developer, Data Scientist...'
                className='w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-slate-700'
              />
            </div>
            <div className='relative'>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className='w-full sm:w-44 px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none appearance-none bg-white text-slate-700 pr-10'
              >
                {levels.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none' />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !role.trim()}
              className='px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200'
            >
              {isSearching ? (
                <LoaderCircleIcon className='animate-spin size-5' />
              ) : (
                <SearchIcon className='size-5' />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Popular Roles */}
          {!result && (
            <div className='mt-5'>
              <p className='text-xs font-medium text-slate-400 mb-2'>Popular searches:</p>
              <div className='flex flex-wrap gap-2'>
                {popularRoles.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(r)}
                    disabled={isSearching}
                    className='px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all disabled:opacity-50'
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className='space-y-6'>
          {/* Header Result */}
          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div>
                <h2 className='text-xl font-bold text-slate-800 flex items-center gap-2'>
                  <TrendingUp className='size-5 text-purple-500' />
                  Skills for "{result.role}"
                </h2>
                <p className='text-sm text-slate-500 mt-1'>
                  Level: <span className='font-medium text-slate-700 capitalize'>{result.level}</span>
                  {' '} &middot; {' '}
                  {result.total_skills} unique skills found across {result.total_matches} matching job listings
                </p>
              </div>
              <button
                onClick={() => { setResult(null); setRole('') }}
                className='px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors'
              >
                New Search
              </button>
            </div>
          </div>

          {/* No results message */}
          {result.message && (
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 text-center'>
              <p className='text-amber-700 font-medium'>{result.message}</p>
              <p className='text-amber-600 text-sm mt-1'>Try searching with a different role name or remove the level filter.</p>
            </div>
          )}

          {/* Must Have Skills */}
          {result.must_have && result.must_have.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='p-1.5 bg-emerald-100 rounded-lg'>
                  <Star className='size-4 text-emerald-600 fill-emerald-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-slate-800'>Must-Have Skills</h3>
                  <p className='text-xs text-slate-400'>Found in 50%+ of matching job listings — these are essential</p>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {result.must_have.map((skill, idx) => (
                  <SkillTag key={idx} name={skill.name} percentage={skill.percentage} type='must' />
                ))}
              </div>
            </div>
          )}

          {/* Good to Have Skills */}
          {result.good_to_have && result.good_to_have.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='p-1.5 bg-blue-100 rounded-lg'>
                  <Zap className='size-4 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-slate-800'>Good-to-Have Skills</h3>
                  <p className='text-xs text-slate-400'>Found in 25-50% of listings — gives you a competitive edge</p>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {result.good_to_have.map((skill, idx) => (
                  <SkillTag key={idx} name={skill.name} percentage={skill.percentage} type='good' />
                ))}
              </div>
            </div>
          )}

          {/* Bonus Skills */}
          {result.bonus_skills && result.bonus_skills.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='p-1.5 bg-purple-100 rounded-lg'>
                  <Award className='size-4 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-slate-800'>Bonus Skills</h3>
                  <p className='text-xs text-slate-400'>Found in some listings — nice extras to stand out</p>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                {result.bonus_skills.map((skill, idx) => (
                  <SkillTag key={idx} name={skill.name} percentage={skill.percentage} type='bonus' />
                ))}
              </div>
            </div>
          )}

          {/* Matched Job Titles */}
          {result.matched_titles && result.matched_titles.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <div className='p-1.5 bg-slate-100 rounded-lg'>
                  <BadgeCheck className='size-4 text-slate-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-slate-800'>Similar Roles Found</h3>
                  <p className='text-xs text-slate-400'>Job titles from our dataset that matched your search</p>
                </div>
              </div>
              <div className='grid sm:grid-cols-2 gap-2'>
                {result.matched_titles.map((match, idx) => (
                  <div key={idx} className='flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100'>
                    <div>
                      <p className='text-sm font-medium text-slate-700'>{match.title}</p>
                      <p className='text-xs text-slate-400 capitalize'>{match.level}</p>
                    </div>
                    <span className='text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200'>
                      {Math.round(match.similarity * 100)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SkillRecommender
