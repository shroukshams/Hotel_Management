using System;
using System.Collections.Generic;
using System.Text;

namespace Hotel.DataAccess.Models
{
    public class Rooms
    {
        public int Hoteld { get; set; }
        public int RoomId { get; set; }
        public string RoomTypeId { get; set; }
        public string RoomNumber { get; set; }
        public string DeScription { get; set; }
        public string ImageUrl { get; set; }
        public int Capacity { get; set; }
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public string Description { get; set; }

    }
}
