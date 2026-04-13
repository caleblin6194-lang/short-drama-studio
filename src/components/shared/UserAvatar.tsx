'use client'

interface UserAvatarProps {
  name: string
  avatar?: string
  size?: number
}

export default function UserAvatar({ name, avatar, size = 32 }: UserAvatarProps) {
  const initials = name.slice(0, 1)
  const colors = ['#6c5ce7', '#00b894', '#0984e3', '#e74c3c', '#fdcb6e', '#e84393', '#00cec9']
  const colorIndex = name.charCodeAt(0) % colors.length
  const bg = colors[colorIndex]

  if (avatar) {
    return <img src={avatar} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}
