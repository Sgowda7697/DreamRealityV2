"use client";
import { motion } from "framer-motion";
import { Clock, MapPin, ExternalLink, Calendar, Users, Camera, Utensils } from "lucide-react";

type Activity = { time: string; name: string; description?: string; lat?: number; lng?: number; };
type Day = { day: number; title: string; activities: Activity[] };

function getActivityIcon(activityName: string) {
  const name = activityName.toLowerCase();
  if (name.includes('food') || name.includes('lunch') || name.includes('dinner') || name.includes('restaurant')) return Utensils;
  if (name.includes('beach') || name.includes('sightseeing') || name.includes('temple') || name.includes('church')) return Camera;
  if (name.includes('check-in') || name.includes('hotel')) return Users;
  return MapPin;
}

function getTimeColor(time: string) {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'from-orange-400 to-yellow-500';
  if (hour >= 12 && hour < 17) return 'from-blue-400 to-blue-600';
  if (hour >= 17 && hour < 21) return 'from-purple-400 to-pink-500';
  return 'from-indigo-500 to-purple-600';
}

export default function Itinerary({ days }: { days: Day[] }) {
  return (
    <div className="space-y-12">
      {days.map((day, dayIndex) => (
        <motion.div 
          key={dayIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: dayIndex * 0.2 }}
          className="relative"
        >
          {/* Day Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-800">Day {day.day}</h3>
                <p className="text-lg text-gray-600 font-medium">{day.title}</p>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="relative ml-7">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-red-200 to-pink-200" />
            
            <div className="space-y-6">
              {day.activities.map((activity, activityIndex) => {
                const ActivityIcon = getActivityIcon(activity.name);
                const timeGradient = getTimeColor(activity.time);
                
                return (
                  <motion.div
                    key={activityIndex}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: (dayIndex * 0.2) + (activityIndex * 0.1) }}
                    className="relative flex gap-6 group"
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-12 h-12 rounded-full bg-gradient-to-r ${timeGradient} shadow-lg flex items-center justify-center -ml-6`}>
                      <ActivityIcon className="w-5 h-5 text-white" />
                    </div>

                    {/* Activity Card */}
                    <div className="flex-1 min-w-0 pb-6">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="timeline-item group-hover:shadow-lg"
                      >
                        {/* Activity Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="time-badge">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                            </div>
                          </div>
                          
                          {activity.lat && activity.lng && (
                            <motion.a
                              href={`https://www.google.com/maps?q=${activity.lat},${activity.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                            >
                              <MapPin className="w-3 h-3" />
                              View Location
                              <ExternalLink className="w-3 h-3" />
                            </motion.a>
                          )}
                        </div>

                        {/* Activity Content */}
                        <div>
                          <h4 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                            {activity.name}
                          </h4>
                          {activity.description && (
                            <p className="text-gray-600 leading-relaxed">
                              {activity.description}
                            </p>
                          )}
                        </div>

                        {/* Activity Type Badge */}
                        <div className="mt-3">
                          <span className="tag-cleartrip text-xs">
                            {activity.lat && activity.lng ? 'Location Available' : 'Experience'}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Day separator (except for last day) */}
          {dayIndex < days.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: (dayIndex + 1) * 0.4 }}
              className="section-divider mt-12"
            />
          )}
        </motion.div>
      ))}
      
      {/* Completion Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: days.length * 0.3 }}
        className="text-center py-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-100"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Itinerary is Ready!</h3>
        
      </motion.div>
    </div>
  );
}