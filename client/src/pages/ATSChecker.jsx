import React, { useState } from 'react'
import { ArrowLeftIcon, CheckCircle2, XCircle, UploadCloud, LoaderCircleIcon, ShieldCheck, AlertTriangle, TrendingUp, FileText, Briefcase, GraduationCap, Sparkles, User, LayoutList, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'

const ScoreCircle = ({ score, size = 160 }) => {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', bg: 'from-emerald-50 to-emerald-100', text: 'text-emerald-600' }
    if (score >= 60) return { stroke: '#3b82f6', bg: 'from-blue-50 to-blue-100', text: 'text-blue-600' }
    if (score >= 40) return { stroke: '#f59e0b', bg: 'from-amber-50 to-amber-100', text: 'text-amber-600' }
    return { stroke: '#ef4444', bg: 'from-red-50 to-red-100', text: 'text-red-600' }
  }

  const color = getColor()

  return (
    <div className='relative flex items-center justify-center'>
      <svg width={size} height={size} className='-rotate-90'>
        <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke='#e5e7eb' strokeWidth='10' />
        <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke={color.stroke} strokeWidth='10'
          strokeLinecap='round' strokeDasharray={circumference} strokeDashoffset={offset}
          className='transition-all duration-1000 ease-out' />
      </svg>
      <div className='absolute flex flex-col items-center'>
        <span className={`text-4xl font-bold ${color.text}`}>{score}</span>
        <span className='text-sm text-slate-400 font-medium'>/ 100</span>
      </div>
    </div>
  )
}

const CategoryCard = ({ title, icon: CategoryIcon, score, maxScore, items, iconColor, bgColor }) => {
  const [isOpen, setIsOpen] = useState(true)
  const percentage = Math.round((score / maxScore) * 100)

  const getBarColor = () => {
    if (percentage >= 80) return 'bg-emerald-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
      <button onClick={() => setIsOpen(!isOpen)} className='w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors'>
        <div className='flex items-center gap-3'>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <CategoryIcon className={`size-5 ${iconColor}`} />
          </div>
          <div className='text-left'>
            <h3 className='font-semibold text-slate-800'>{title}</h3>
            <p className='text-xs text-slate-400'>{score} / {maxScore} points</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='w-24 h-2 bg-gray-200 rounded-full overflow-hidden'>
            <div className={`h-full rounded-full transition-all duration-700 ${getBarColor()}`} style={{ width: `${percentage}%` }} />
          </div>
          <span className='text-sm font-semibold text-slate-600 w-10 text-right'>{percentage}%</span>
          {isOpen ? <ChevronUp className='size-4 text-slate-400' /> : <ChevronDown className='size-4 text-slate-400' />}
        </div>
      </button>

      {isOpen && items && items.length > 0 && (
        <div className='px-4 pb-4 space-y-2'>
          {items.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${item.found ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {item.found
                ? <CheckCircle2 className='size-4 text-emerald-500 flex-shrink-0' />
                : <XCircle className='size-4 text-red-400 flex-shrink-0' />
              }
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ATSChecker = () => {
  const { token } = useSelector(state => state.auth)
  const [file, setFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [notResumeError, setNotResumeError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setResult(null)
      setNotResumeError('')
    } else if (selectedFile) {
      toast.error('Please upload a PDF file only.')
    }
  }

  const analyzeResume = async () => {
    if (!file) {
      toast.error('Please upload a resume PDF first.')
      return
    }

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)

      const { data } = await api.post('/api/ai/check-ats', formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data'
        }
      })

      setResult(data)
    } catch (error) {
      const errData = error?.response?.data
      if (errData?.error === 'not_a_resume') {
        setNotResumeError(errData.message || 'This file does not appear to be a resume.')
      } else {
        toast.error(errData?.message || 'ATS analysis failed. Make sure the ML server is running.')
      }
    }
    setIsAnalyzing(false)
  }

  const getRatingBadge = () => {
    if (!result) return null
    const colorMap = {
      green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      orange: 'bg-amber-100 text-amber-700 border-amber-200',
      red: 'bg-red-100 text-red-700 border-red-200'
    }
    return colorMap[result.rating_color] || colorMap.blue
  }

  const categoryConfig = {
    contact_info: { title: 'Contact Information', icon: User, iconColor: 'text-violet-600', bgColor: 'bg-violet-100' },
    section_headings: { title: 'Section Headings', icon: LayoutList, iconColor: 'text-sky-600', bgColor: 'bg-sky-100' },
    professional_summary: { title: 'Professional Summary', icon: FileText, iconColor: 'text-teal-600', bgColor: 'bg-teal-100' },
    work_experience: { title: 'Work Experience', icon: Briefcase, iconColor: 'text-orange-600', bgColor: 'bg-orange-100' },
    skills: { title: 'Skills', icon: Sparkles, iconColor: 'text-pink-600', bgColor: 'bg-pink-100' },
    education: { title: 'Education', icon: GraduationCap, iconColor: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    formatting: { title: 'Formatting & Readability', icon: ShieldCheck, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-8'>
      {/* Header */}
      <Link to='/app' className='inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all mb-6'>
        <ArrowLeftIcon className='size-4' /> Back to Dashboard
      </Link>

      <div className='text-center mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-3'>
          <ShieldCheck className='size-4' /> ATS Resume Analysis
        </div>
        <h1 className='text-3xl font-bold text-slate-800'>Check Your Resume's ATS Score</h1>
        <p className='text-slate-500 mt-2 max-w-lg mx-auto'>
          Upload your resume and get a detailed ATS compatibility analysis with actionable suggestions to improve your score.
        </p>
      </div>

      {/* Upload Section */}
      {!result && (
        <div className='max-w-md mx-auto'>
          <label htmlFor='ats-file-input' className='block cursor-pointer'>
            <div className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 py-16 transition-all duration-300 ${file ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'}`}>
              {file ? (
                <>
                  <div className='p-3 bg-blue-100 rounded-xl'>
                    <FileText className='size-8 text-blue-600' />
                  </div>
                  <div className='text-center'>
                    <p className='font-semibold text-blue-700'>{file.name}</p>
                    <p className='text-sm text-slate-400 mt-1'>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <p className='text-xs text-blue-500'>Click to change file</p>
                </>
              ) : (
                <>
                  <div className='p-3 bg-slate-100 rounded-xl'>
                    <UploadCloud className='size-10 text-slate-400' />
                  </div>
                  <div className='text-center'>
                    <p className='font-medium text-slate-600'>Drop your resume here or click to upload</p>
                    <p className='text-sm text-slate-400 mt-1'>Only PDF files supported</p>
                  </div>
                </>
              )}
            </div>
          </label>
          <input type='file' id='ats-file-input' accept='.pdf' hidden onChange={handleFileChange} />

          {notResumeError && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3'>
              <ShieldCheck className='size-5 text-red-500 mt-0.5 shrink-0' />
              <div>
                <p className='font-semibold text-red-700 text-sm'>Not a Resume</p>
                <p className='text-red-600 text-sm mt-0.5'>{notResumeError}</p>
              </div>
            </div>
          )}

          <button
            onClick={analyzeResume}
            disabled={!file || isAnalyzing}
            className='w-full mt-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200'
          >
            {isAnalyzing ? (
              <>
                <LoaderCircleIcon className='animate-spin size-5' />
                Analyzing Resume...
              </>
            ) : (
              <>
                <ShieldCheck className='size-5' />
                Analyze ATS Score
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className='space-y-6 animate-in fade-in'>
          {/* Score Overview */}
          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-8'>
            <div className='flex flex-col sm:flex-row items-center gap-8'>
              <ScoreCircle score={result.ats_score} />
              <div className='flex-1 text-center sm:text-left'>
                <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2'>
                  <h2 className='text-2xl font-bold text-slate-800'>ATS Score</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingBadge()}`}>
                    {result.rating}
                  </span>
                </div>
                <p className='text-slate-500 text-sm'>
                  {result.ats_score >= 80 && "Your resume is well-optimized for ATS systems! Keep it up."}
                  {result.ats_score >= 60 && result.ats_score < 80 && "Your resume is good but has room for improvement. Check the suggestions below."}
                  {result.ats_score >= 40 && result.ats_score < 60 && "Your resume needs improvement to pass most ATS filters. Follow the suggestions below."}
                  {result.ats_score < 40 && "Your resume needs significant improvements to pass ATS screening. Follow all suggestions below."}
                </p>

                <div className='flex flex-wrap gap-4 mt-4'>
                  <div className='flex items-center gap-2 text-sm text-slate-500'>
                    <FileText className='size-4' />
                    <span>{result.word_count} words</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-slate-500'>
                    <LayoutList className='size-4' />
                    <span>{result.page_count} page{result.page_count > 1 ? 's' : ''}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-slate-500'>
                    <Sparkles className='size-4' />
                    <span>{result.found_skills?.length || 0} skills detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className='text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2'>
              <TrendingUp className='size-5 text-blue-500' /> Detailed Breakdown
            </h3>
            <div className='grid gap-4'>
              {Object.entries(result.categories).map(([key, cat]) => {
                const config = categoryConfig[key]
                if (!config) return null
                return (
                  <CategoryCard
                    key={key}
                    title={config.title}
                    icon={config.icon}
                    score={cat.score}
                    maxScore={cat.max}
                    items={cat.items}
                    iconColor={config.iconColor}
                    bgColor={config.bgColor}
                  />
                )
              })}
            </div>
          </div>

          {/* Skills Found */}
          {result.found_skills && result.found_skills.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <h3 className='font-semibold text-slate-800 mb-3 flex items-center gap-2'>
                <Sparkles className='size-5 text-pink-500' /> Skills Detected ({result.found_skills.length})
              </h3>
              <div className='flex flex-wrap gap-2'>
                {result.found_skills.map((skill, idx) => (
                  <span key={idx} className='px-3 py-1.5 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 text-sm rounded-lg border border-slate-200 font-medium'>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className='bg-amber-50 rounded-xl border border-amber-200 p-6'>
              <h3 className='font-semibold text-amber-800 mb-4 flex items-center gap-2'>
                <AlertTriangle className='size-5 text-amber-500' /> Improvement Suggestions ({result.suggestions.length})
              </h3>
              <div className='space-y-2'>
                {result.suggestions.map((suggestion, idx) => (
                  <div key={idx} className='flex items-start gap-3 bg-white rounded-lg p-3 border border-amber-100'>
                    <span className='flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5'>
                      {idx + 1}
                    </span>
                    <p className='text-sm text-slate-700'>{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Try Again Button */}
          <div className='text-center pt-2'>
            <button
              onClick={() => { setResult(null); setFile(null) }}
              className='px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 inline-flex items-center gap-2'
            >
              <UploadCloud className='size-5' /> Check Another Resume
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ATSChecker
