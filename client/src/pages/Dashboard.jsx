import { FilePenLineIcon, LoaderCircleIcon, PencilIcon, PlusIcon, TrashIcon, UploadCloud, UploadCloudIcon, XIcon, ShieldCheckIcon, SearchIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyResumeData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'

const Dashboard = () => {

  const { user, token } = useSelector(state => state.auth)

  const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"]
  const [allResumes, setAllResumes] = useState([])
  const [showCreateResume, setShowCreateResume] = useState(false)
  const [showUploadResume, setShowUploadResume] = useState(false)
  const [title, setTitle] = useState('')
  const [resume, setResume] = useState(null)
  const [editResumeId, setEditResumeId] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const loadAllResumes = async () => {
    try {
      const { data } = await api.get('/api/users/resumes', { headers: { Authorization: token } })
      setAllResumes(data.resumes)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const createResume = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.post('/api/resumes/create', { title }, { headers: { Authorization: token } })
      setAllResumes([...allResumes, data.resume])
      setTitle('')
      setShowCreateResume(false)
      navigate(`/app/builder/${data.resume._id}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const uploadResume = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('resume', resume)

      const { data } = await api.post('/api/ai/upload-resume', formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data'
        }
      })

      setTitle('')
      setResume(null)
      setShowUploadResume(false)
      navigate(`/app/builder/${data.resumeId}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Upload failed')
    }
    setIsLoading(false)
  }

  const editTitle = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.put(`/api/resumes/update`, { resumeId: editResumeId, resumeData: { title } }, { headers: { Authorization: token } })
      setAllResumes(allResumes.map(resume => resume._id === editResumeId ? { ...resume, title } : resume))
      setTitle('')
      setEditResumeId('')
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }

  }

  const deleteResume = async (resumeId) => {
    try {
      const confirm = window.confirm('Are you sure you want to delete this resume?')
      if (confirm) {
        const { data } = await api.delete(`/api/resumes/delete/${resumeId}`, { headers: { Authorization: token } })
        setAllResumes(allResumes.filter(resume => resume._id !== resumeId))
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }

  }

  useEffect(() => {
    loadAllResumes()
  }, [])

  return (
    <div>
      <div className='max-w-7xl mx-auto px-4 py-8'>

        <p className='text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden'>Welcome, Joe Doe</p>

        <div className='flex gap-4 '>
          <button onClick={() => setShowCreateResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-teal-500 hover:shadow-md transition-all duration-300 cursor-pointer'>
            <PlusIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm text-white rounded-xl' />
            <p className='text-sm group-hover:text-teal-600 transition-all font-medium duration-300'>Create Resume</p>
          </button>
          <button onClick={() => setShowUploadResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-emerald-500 hover:shadow-md transition-all duration-300 cursor-pointer'>
            <UploadCloudIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm text-white rounded-xl' />
            <p className='text-sm group-hover:text-emerald-600 transition-all font-medium duration-300'>Upload Existing</p>
          </button>
          <button onClick={() => navigate('/app/ats-checker')} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-blue-500 hover:shadow-md transition-all duration-300 cursor-pointer'>
            <ShieldCheckIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm text-white rounded-xl' />
            <p className='text-sm group-hover:text-blue-600 transition-all font-medium duration-300'>Check ATS Score</p>
          </button>
          <button onClick={() => navigate('/app/skill-recommender')} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-purple-500 hover:shadow-md transition-all duration-300 cursor-pointer'>
            <SearchIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm text-white rounded-xl' />
            <p className='text-sm group-hover:text-purple-600 transition-all font-medium duration-300'>Skill Finder</p>
          </button>
        </div>

        <hr className='border-slate-300 my-6 sm:w-[305px]' />

        <div className="grid grid-cols-2 sm:flex flex-wrap gap-4 ">
          {allResumes.map((resume, index) => {
            const baseColor = colors[index % colors.length];
            return (
              <button key={index} onClick={() => navigate(`/app/builder/${resume._id}`)} className='relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-xl gap-2 border group hover:shadow-md transition-all duration-300 cursor-pointer' style={{ background: `linear-gradient(135deg, ${baseColor}05, ${baseColor}15)`, borderColor: baseColor + '30' }}>

                <FilePenLineIcon className="size-7 group-hover:scale-105 transition-all " style={{ color: baseColor }} />
                <p className='text-sm group-hover:scale-105 transition-all  px-2 text-center' style={{ color: baseColor }}>{resume.title}</p>
                <p className='absolute bottom-1 text-[11px] text-slate-400 group-hover:text-slate-500 transition-all duration-300 px-2 text-center' style={{ color: baseColor + '90' }}>
                  Updated on {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
                <div onClick={e => e.stopPropagation()} className='absolute top-1 right-1 group-hover:flex items-center hidden'>
                  <TrashIcon onClick={() => deleteResume(resume._id)} className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors" />
                  <PencilIcon onClick={() => { setEditResumeId(resume._id); setTitle(resume.title) }} className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>

        {showCreateResume && (
          <form onSubmit={createResume} onClick={() => setShowCreateResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white border shadow-xl rounded-2xl w-full max-w-sm p-7'>
              <h2 className='text-xl font-bold mb-4 text-slate-800'>Create a Resume</h2>
              <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter resume title' className='w-full px-4 py-2 mb-5 focus:border-teal-600 focus:ring-1 ring-teal-600' required />

              <button className='w-full py-2.5 bg-teal-600 shadow-sm shadow-teal-200 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors'>Create Resume</button>
              <XIcon className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors' onClick={() => { setShowCreateResume(false); setTitle('') }} />
            </div>
          </form>
        )
        }

        {showUploadResume && (
          <form onSubmit={uploadResume} onClick={() => setShowUploadResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur-sm z-10 flex items-center justify-center'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white border shadow-xl rounded-2xl w-full max-w-sm p-7'>
              <h2 className='text-xl font-bold mb-4 text-slate-800'>Upload Resume</h2>
              <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter resume title' className='w-full px-4 py-2 mb-4 focus:border-teal-600 focus:ring-1 ring-teal-600' required />
              <div>
                <label htmlFor="resume-input" className="block text-sm font-medium text-slate-700 mb-2 mt-1">
                  Select resume file
                  <div className='flex flex-col items-center justify-center gap-2 border group text-slate-400 border-slate-300 bg-slate-50 border-dashed rounded-xl p-4 py-10 my-2 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 cursor-pointer transition-colors'>
                    {resume ? (
                      <p className='text-teal-700 font-medium'>{resume.name}</p>
                    ) : (
                      <>
                        <UploadCloud className='size-12 stroke-1' />
                        <p>Upload resume</p>
                      </>
                    )}
                  </div>
                </label>
                <input type="file" id='resume-input' accept='.pdf' hidden onChange={(e) => setResume(e.target.files[0])} />
              </div>
              <button disabled={isLoading} className='w-full py-2.5 mt-2 bg-teal-600 shadow-sm shadow-teal-200 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2'>
                {isLoading && <LoaderCircleIcon className='animate-spin size-4 text-white' />}
                {isLoading ? 'Uploading...' : 'Upload Resume'}

              </button>
              <XIcon className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors' onClick={() => { setShowUploadResume(false); setTitle('') }} />
            </div>
          </form>
        )
        }

        {editResumeId && (
          <form onSubmit={editTitle} onClick={() => setEditResumeId('')} className='fixed inset-0 bg-black/70 backdrop-blur-sm z-10 flex items-center justify-center'>
            <div onClick={e => e.stopPropagation()} className='relative bg-white border shadow-xl rounded-2xl w-full max-w-sm p-7'>
              <h2 className='text-xl font-bold mb-4 text-slate-800'>Edit Resume Title</h2>
              <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter resume title' className='w-full px-4 py-2 mb-5 focus:border-teal-600 focus:ring-1 ring-teal-600' required />

              <button className='w-full py-2.5 bg-teal-600 shadow-sm shadow-teal-200 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors'>Update</button>
              <XIcon className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors' onClick={() => { setEditResumeId(''); setTitle('') }} />
            </div>
          </form>
        )
        }

      </div>
    </div>
  )
}

export default Dashboard
